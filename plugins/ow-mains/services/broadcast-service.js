const Rx = require('rx');
const Discord = require('discord.js');
const Service = require('chaos-core').Service;

const {InvalidBroadcastError} = require("../errors");
const DataKeys = require('../datakeys');

const {
  BroadcastingNotAllowedError,
  BroadcastCanceledError,
} = require('../errors');

const CONFIRM_YES_EMOJI_NAME = "voteyea";
const CONFIRM_NO_EMOJI_NAME = "votenay";

const FALLBACK_YES = "👍";
const FALLBACK_NO = "👎";

class BroadcastService extends Service {
  get broadcastTypes() {
    return this.chaos.config.broadcastTypes;
  }

  onListen() {
    this.owmnService = this.chaos.getService('owMains', 'OwmnService');
  }

  isValidType(broadcastType) {
    return this.broadcastTypes.includes(broadcastType.toLowerCase());
  }

  checkBroadcastAllowed(fromGuild) {
    if (!this.owmnService.isOwmnGuild(fromGuild)) {
      throw new BroadcastingNotAllowedError(
        `Broadcasting from this server is not allowed.`,
      );
    }
  }

  checkValidBroadcast(broadcastType, broadcastBody) {
    if (!this.isValidType(broadcastType)) {
      throw new InvalidBroadcastError(
        `Broadcast type ${broadcastType} is not valid. Valid types: ${this.broadcastTypes.join(', ')}`,
      );
    } else if (broadcastBody.indexOf('@everyone') !== -1) {
      throw new InvalidBroadcastError(
        `Pinging @ everyone is not allowed. Please remove the ping from your message.`,
      );
    } else if (broadcastBody.indexOf('@here') !== -1) {
      throw new InvalidBroadcastError(
        `Pinging @ here is not allowed. Please remove the ping from your message.`,
      );
    }
  }

  addConfirmReactions(message) {
    let emoji = this.getConfirmEmoji(message.guild);

    return Rx.Observable
      .of('')
      .flatMap(() => message.react(emoji.yes || FALLBACK_YES))
      .flatMap(() => message.react(emoji.no || FALLBACK_NO));
  }

  removeOwnReactions(message) {
    return Rx.Observable
      .from(message.reactions.values())
      .filter((reaction) => reaction.remove(this.chaos.discord.user));
  }

  getConfirmEmoji(guild) {
    return {
      yes: guild.emojis.find((e) => e.name.toLowerCase() === CONFIRM_YES_EMOJI_NAME) || FALLBACK_YES,
      no: guild.emojis.find((e) => e.name.toLowerCase() === CONFIRM_NO_EMOJI_NAME) || FALLBACK_NO,
    };
  }

  /**
   * @returns {Rx.Observable<any>}
   */
  confirmBroadcast(context, broadcastType, broadcastBody) {
    return Rx.Observable
      .of('')
      .map(() => (new Discord.RichEmbed()).setDescription(broadcastBody))
      .flatMap((broadcastEmbed) => context.message.channel.send(
        `Broadcast this to "${broadcastType}"?`,
        {embed: broadcastEmbed},
      ))
      .flatMap((confirmMessage) =>
        this.addConfirmReactions(confirmMessage)
          .map(() => confirmMessage),
      )
      .flatMap((confirmMessage) => {
        let allowedEmojiNames = [
          CONFIRM_YES_EMOJI_NAME,
          CONFIRM_NO_EMOJI_NAME,
          FALLBACK_YES,
          FALLBACK_NO,
        ];

        return Rx.Observable
          .fromPromise(
            confirmMessage.awaitReactions(
              (reaction, user) =>
                allowedEmojiNames.includes(reaction.emoji.name.toLowerCase()) &&
                user.id === context.message.author.id,
              {max: 1},
            ),
          )
          .map((reactions) => ({confirmMessage, reactions}));
      })
      .flatMap(({confirmMessage, reactions}) => {
        let yesEmojiNames = [CONFIRM_YES_EMOJI_NAME, FALLBACK_YES];

        if (reactions.find((r) => yesEmojiNames.includes(r.emoji.name.toLowerCase()))) {
          return Rx.Observable.of({confirmMessage, result: true});
        } else {
          return Rx.Observable.of({confirmMessage, result: false});
        }
      })
      .flatMap(({confirmMessage, result}) =>
        this.removeOwnReactions(confirmMessage)
          .defaultIfEmpty('')
          .last()
          .map(() => result),
      )
      .flatMap((result) => {
        if (!result) {
          return Rx.Observable.throw(new BroadcastCanceledError());
        }
        return Rx.Observable.of(result);
      });
  }

  broadcastMessage(broadcastType, broadcastBody) {
    return Rx.Observable
      .from(this.chaos.discord.guilds.values())
      .flatMap((guild) =>
        this.getBroadcastChannel(broadcastType, guild)
          .flatMap((channel) => channel.send(broadcastBody)),
      );
  }

  getBroadcastChannel(broadcastType, guild) {
    return this.chaos
      .getGuildData(guild.id, DataKeys.broadcastChannelId(broadcastType))
      .filter((channelId) => channelId !== null)
      .map((channelId) => guild.channels.get(channelId))
      .filter((channel) => channel.permissionsFor(this.chaos.discord.user).has(Discord.Permissions.FLAGS.SEND_MESSAGES));
  }
}

module.exports = BroadcastService;
