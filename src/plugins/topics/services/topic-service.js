const Service = require("chaos-core").Service;

class TopicService extends Service {
  constructor(chaos) {
    super(chaos);

    this.watchedChannels = {};

    this.chaos.on("message", async (message) => this.onMessage(message));
  }

  async onMessage(message) {
    if (message.system) return;
    if (!this.watchedChannels[message.channel.id]) return;
    delete this.watchedChannels[message.channel.id];
    this.chaos.logger.debug(`Message in ${message.channel.name}: ${message.content}`);
    await message.pin().catch((error) => {
      this.chaos.logger.error(error);
    });
  }

  watchChannel(channel) {
    this.chaos.logger.debug(`Watching for messages in ${channel.name}`);
    this.watchedChannels[channel.id] = true;
  }

  findChannel(guild, channelName) {
    let textChannels = guild.channels.filter((channel) => channel.type === 'text');
    let channelIdMatches = channelName.match(/<#!?(\d+)>|^(\d+)$/);
    if (channelIdMatches) {
      let channelId = channelIdMatches[1] || channelIdMatches[2];
      return textChannels.find((channel) => channel.id === channelId);
    } else {
      let searchName = this.channelNameSafeString(channelName).toLowerCase();
      return textChannels.find((channel) => channel.name.toLowerCase() === searchName);
    }
  }

  getOpenTopicsCategory(guild) {
    return guild.channels
      .filter((c) => c.type === "category")
      .find((c) => c.name.toLowerCase().includes('!topic'));
  }

  getClosedTopicsCategory(guild) {
    return guild.channels
      .filter((c) => c.type === "category")
      .find((c) => c.name.toLowerCase().includes('!close'));
  }

  /**
   * Turns a string into a channel name safe string by replacing invalid charaters with dashes
   *
   * @param string {string} The string to turn into a channel name
   * @returns {string} A channel name safe string
   */
  channelNameSafeString(string) {
    return string.replace(/[^\w_-]/g, ' ').trim().replace(/\s+/g, '-');
  }
}

module.exports = TopicService;
