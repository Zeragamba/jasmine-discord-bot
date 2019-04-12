const Rx = require('rx');

const {BROADCAST_TYPES} = require('../utility');

module.exports = {
  name: 'subBroadcast',
  description: `Subscribe to a type of broadcast in a channel. Broadcast types are: ${Object.keys(BROADCAST_TYPES).join(', ')}`,

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

  run(context) {
    let guild = context.guild;
    let typeString = context.inputs.type;
    let channelString = context.inputs.channel;

    let broadcastType = Object.keys(BROADCAST_TYPES).find((t) => t.toLowerCase() === typeString.toLowerCase());
    if (!broadcastType) {
      return Rx.Observable.of({
        content: `${typeString} is not a valid broadcast type. Valid types: ${Object.keys(BROADCAST_TYPES).join(', ')}`,
      });
    }

    let channel = guild.channels.find((c) => c.toString() === channelString || c.id.toString() === channelString);
    if (!channel) {
      return Rx.Observable.of({
        content: "I was not able to find that channel",
      });
    }

    let datakey = BROADCAST_TYPES[broadcastType];
    return this.chaos
      .setGuildData(guild.id, datakey, channel.id)
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
