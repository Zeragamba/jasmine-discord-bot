const {of} = require('rxjs');
const {flatMap, tap, catchError, filter} = require('rxjs/operators');
const Service = require("chaos-core").Service;

class TopicService extends Service {
  constructor(chaos) {
    super(chaos);

    this.watchedChannels = {};
  }

  onListen() {
    this.chaos.streams.message$.pipe(
      filter((message) => !message.system),
      filter((message) => this.watchedChannels[message.channel.id]),
      tap((message) => delete this.watchedChannels[message.channel.id]),
      tap((message) => this.chaos.logger.debug(`Message in ${message.channel.name}: ${message.content}`)),
      flatMap((message) => message.pin()),
      catchError((error) => {
        this.chaos.logger.error(error);
        return of('');
      }),
    ).subscribe();

    return of(true);
  }

  watchChannel(channel) {
    this.chaos.logger.debug(`Watching for messages in ${channel.name}`);
    this.watchedChannels[channel.id] = true;
  }

  findChannel(guild, channelName) {
    let textChannels = guild.channels.filter((channel) => channel.type === 'text');
    let foundChannel = null;

    let channelIdMatches = channelName.match(/<#!?(\d+)>|^(\d+)$/);
    if (channelIdMatches) {
      let channelId = channelIdMatches[1] || channelIdMatches[2];
      foundChannel = textChannels.find((channel) => channel.id === channelId);
    } else {
      let searchName = this.channelNameSafeString(channelName).toLowerCase();
      foundChannel = textChannels.find((channel) => channel.name.toLowerCase() === searchName);
    }

    return foundChannel;
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
