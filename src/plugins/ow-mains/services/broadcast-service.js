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

  async addConfirmReactions(message) {
    let emoji = this.getConfirmEmoji(message.guild);
    await message.react(emoji.yes || FALLBACK_YES);
    await message.react(emoji.no || FALLBACK_NO);
  }

  async removeOwnReactions(message) {
    const reactions = message.reactions.array();
    return Promise.all(reactions.map(async (reaction) => {
      return reaction.remove(this.chaos.discord.user);
    }));
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
  async confirmBroadcast(context, broadcastType, broadcastBody) {
    const broadcastEmbed = new Discord.RichEmbed();
    broadcastEmbed.setDescription(broadcastBody);
    const confirmMessage = await context.message.channel.send(
      `Broadcast this to "${broadcastType}"?`,
      {embed: broadcastEmbed},
    );

    let allowedEmojiNames = [
      CONFIRM_YES_EMOJI_NAME,
      CONFIRM_NO_EMOJI_NAME,
      FALLBACK_YES,
      FALLBACK_NO,
    ];

    let yesEmojiNames = [
      CONFIRM_YES_EMOJI_NAME,
      FALLBACK_YES,
    ];

    const reactionFilter = (reaction, user) => (
      user.id === context.message.author.id
      && allowedEmojiNames.includes(reaction.emoji.name.toLowerCase())
    );

    await this.addConfirmReactions(confirmMessage);
    const reactions = await confirmMessage.awaitReactions(reactionFilter, {max: 1});
    await this.removeOwnReactions(confirmMessage);

    if (reactions.find((r) => yesEmojiNames.includes(r.emoji.name.toLowerCase()))) {
      return true;
    } else {
      throw new BroadcastCanceledError();
    }
  }

  async broadcastMessage(broadcastType, broadcastBody) {
    const subscribedChannels = [];

    for (const guild of this.chaos.discord.guilds.values()) {
      const channel = await this.getBroadcastChannel(broadcastType, guild);
      if (channel) subscribedChannels.push(channel);
    }

    return Promise.all(subscribedChannels.map(async (channel) => channel.send(broadcastBody)));
  }

  async setBroadcastChannel(guild, broadcastType, channel) {
    return this.setGuildData(guild.id, DataKeys.broadcastChannelId(broadcastType), channel.id);
  }

  async getBroadcastChannel(broadcastType, guild) {
    const channelId = await this.getGuildData(guild.id, DataKeys.broadcastChannelId(broadcastType));
    if (!channelId) {
      return;
    }

    const channel = guild.channels.get(channelId);
    if (!channel || !channel.permissionsFor(this.chaos.discord.user).has(Discord.Permissions.FLAGS.SEND_MESSAGES)) {
      return;
    }

    return channel;
  }
}

module.exports = BroadcastService;
