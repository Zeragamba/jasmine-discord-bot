const Rx = require('rx');
const DataKeys = require('../datakeys');

const { NET_MOD_LOG_TOKEN } = require('../utility');

module.exports = {
  name: 'enableNetModLog',
  description: `Enable network mod log reporting to this server.`,

  inputs: [
    {
      name: 'token',
      required: true,
    },
    {
      name: 'channel',
      required: true,
    },
  ],

  run(context) {
    let guild = context.guild;
    let token = context.inputs.token;
    let channelString = context.inputs.channel;

    if (token !== NET_MOD_LOG_TOKEN) {
      return {
        content: `I'm sorry, but that token is not valid for the network mod log`,
      };
    }

    let channel = guild.channels.find((c) => c.toString() === channelString || c.id.toString() === channelString);
    if (!channel) {
      return {
        content: "I was not able to find that channel",
      };
    }

    return this.chaos.setGuildData(guild.id, DataKeys.NET_MOD_LOG_TOKEN, token)
      .flatMap(() => this.chaos.setGuildData(guild.id, DataKeys.NET_MOD_LOG, channel.id))
      .flatMap(() => channel.send('I will post the network moderation log here now.'))
      .flatMap(() => ({
        status: 200,
        content: `This server will now receive the network moderation log.`,
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
