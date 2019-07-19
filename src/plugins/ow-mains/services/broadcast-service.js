const {of, from, throwError} = require('rxjs');
const {flatMap, last, map, filter} = require('rxjs/operators');
const Discord = require('discord.js');
const Service = require('../../chaos-core/chaos-core').Service;

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

  isValidType(broadcastType) {
    return this.broadcastTypes.includes(broadcastType.toLowerCase());
  }

  checkBroadcastAllowed(fromGuild) {
    this.owmnService = this.chaos.getService('owMains', 'OwmnService');
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

    if (broadcastType === "blizzard") {
      if (broadcastBody.search(/https?:/) === -1) {
        this.chaos.logger.debug(`Broadcast body ${broadcastBody} did not contain link.`);
        throw new InvalidBroadcastError(
          `A link is required for Blizzard broadcasts.`,
        );
      }
    }
  }

  addConfirmReactions(message) {
    let emoji = this.getConfirmEmoji(message.guild);

    return of('').pipe(
      flatMap(() => message.react(emoji.yes || FALLBACK_YES)),
      flatMap(() => message.react(emoji.no || FALLBACK_NO)),
    );
  }

  removeOwnReactions(message) {
    return from(message.reactions.values()).pipe(
      filter((reaction) => reaction.remove(this.chaos.discord.user)),
    );
  }

  getConfirmEmoji(guild) {
    return {
      yes: guild.emojis.find((e) => e.name.toLowerCase() === CONFIRM_YES_EMOJI_NAME) || FALLBACK_YES,
      no: guild.emojis.find((e) => e.name.toLowerCase() === CONFIRM_NO_EMOJI_NAME) || FALLBACK_NO,
    };
  }

  /**
   * @returns {Observable<any>}
   */
  confirmBroadcast(context, broadcastType, broadcastBody) {
    return of('').pipe(
      map(() => (new Discord.RichEmbed()).setDescription(broadcastBody)),
      flatMap((broadcastEmbed) => context.message.channel.send(
        `Broadcast this to "${broadcastType}"?`,
        {embed: broadcastEmbed},
      )),
      flatMap((confirmMessage) => this.addConfirmReactions(confirmMessage).pipe(
        map(() => confirmMessage),
      )),
      flatMap((confirmMessage) => {
        let allowedEmojiNames = [
          CONFIRM_YES_EMOJI_NAME,
          CONFIRM_NO_EMOJI_NAME,
          FALLBACK_YES,
          FALLBACK_NO,
        ];

        return of().pipe(
          flatMap(() => confirmMessage.awaitReactions(
            (reaction, user) =>
              allowedEmojiNames.includes(reaction.emoji.name.toLowerCase()) &&
              user.id === context.message.author.id,
            {max: 1},
          )),
          map((reactions) => ({confirmMessage, reactions})),
        );
      }),
      flatMap(({confirmMessage, reactions}) => {
        let yesEmojiNames = [CONFIRM_YES_EMOJI_NAME, FALLBACK_YES];

        if (reactions.find((r) => yesEmojiNames.includes(r.emoji.name.toLowerCase()))) {
          return of({confirmMessage, result: true});
        } else {
          return of({confirmMessage, result: false});
        }
      }),
      flatMap(({confirmMessage, result}) => this.removeOwnReactions(confirmMessage).pipe(
        last(null, ''),
        map(() => result),
      )),
      flatMap((result) => {
        if (!result) {
          return throwError(new BroadcastCanceledError());
        }
        return of(result);
      }),
    );
  }

  broadcastMessage(broadcastType, broadcastBody) {
    return from(this.chaos.discord.guilds.values()).pipe(
      flatMap((guild) => this.getBroadcastChannel(broadcastType, guild)),
      flatMap((channel) => channel.send(broadcastBody)),
    );
  }

  getBroadcastChannel(broadcastType, guild) {
    return this.chaos.getGuildData(guild.id, DataKeys.broadcastChannelId(broadcastType)).pipe(
      filter((channelId) => channelId !== null),
      map((channelId) => guild.channels.get(channelId)),
      filter((channel) => typeof channel !== "undefined"),
      filter((channel) => channel.permissionsFor(this.chaos.discord.user).has(Discord.Permissions.FLAGS.SEND_MESSAGES)),
    );
  }
}

module.exports = BroadcastService;
