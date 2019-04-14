const Rx = require('rx');
const DataKeys = require('../datakeys');

module.exports = {
  name: 'enableNetModLog',
  description: `Enable network mod log reporting to this server.`,

  inputs: [
    {
      name: 'channel',
      required: true,
    },
  ],

  onListen() {
    this.owmnService = this.chaos.getService('owMains', 'OwmnService');
  },

  run(context) {
    let guild = context.guild;
    let token = context.inputs.token;
    let channelString = context.inputs.channel;

    if (!this.owmnService.isOwmnGuild(guild)) {
      return;
    }

    let channel = guild.channels.find((c) => c.toString() === channelString || c.id.toString() === channelString);
    if (!channel) {
      return {
        content: "I was not able to find that channel",
      };
    }

    return this.chaos.setGuildData(guild.id, DataKeys.netModLogToken, token)
      .flatMap(() => this.chaos.setGuildData(guild.id, DataKeys.netModLogChannel, channel.id))
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
