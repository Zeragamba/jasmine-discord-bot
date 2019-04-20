const Rx = require('rx');

const DataKeys = require('../datakeys');

module.exports = {
  name: 'subBroadcast',
  description: `Subscribe to a type of broadcast in a channel.`,

  inputs: [
    {
      name: 'type',
      required: true,
    },
    {
      name: 'channel',
      required: true,
    },
  ],

  onListen() {
    this.broadcastService = this.chaos.getService('owMains', 'BroadcastService');
  },

  run(context) {
    let guild = context.guild;
    let broadcastType = context.inputs.type;
    let channelString = context.inputs.channel;

    if (!this.broadcastService.isValidType(broadcastType)) {
      return Rx.Observable.of({
        content: `${broadcastType} is not a valid broadcast type. Valid types: ${this.broadcastService.broadcastTypes.join(', ')}`,
      });
    }

    let channel = guild.channels.find((c) => c.toString() === channelString || c.id.toString() === channelString);
    if (!channel) {
      return Rx.Observable.of({
        content: "I was not able to find that channel",
      });
    }

    return this.chaos
      .setGuildData(guild.id, DataKeys.broadcastChannelId(broadcastType), channel.id)
      .flatMap(() => channel.send(`I will send ${broadcastType} broadcasts here.`))
      .map(() => ({
        content: `I have enabled ${broadcastType} broadcasts in the channel ${channel}`,
      }))
      .catch((error) => {
        switch (error.name) {
          case 'DiscordAPIError':
            if (error.message === "Missing Permissions") {
              return Rx.Observable.return({
                status: 400,
                content: `Whoops, I do not have permission to talk in that channel.`,
              });
            }
            else {
              return Rx.Observable.throw(error);
            }
          default:
            return Rx.Observable.throw(error);
        }
      });
  },
};
