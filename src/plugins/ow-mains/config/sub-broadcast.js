const {of, throwError} = require('rxjs');
const {flatMap, map, catchError} = require('rxjs/operators');

const DataKeys = require('../datakeys');

module.exports = {
  name: 'subBroadcast',
  description: `Subscribe to a type of broadcast in a channel.`,

  args: [
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
    const broadcastService = this.chaos.getService('owMains', 'BroadcastService');
    const guild = context.guild;
    const broadcastType = context.args.type;
    const channelString = context.args.channel;

    if (!broadcastService.isValidType(broadcastType)) {
      return of({
        content: `${broadcastType} is not a valid broadcast type. Valid types: ${broadcastService.broadcastTypes.join(', ')}`,
      });
    }

    let channel = guild.channels.find((c) => c.toString() === channelString || c.id.toString() === channelString);
    if (!channel) {
      return of({
        content: "I was not able to find that channel",
      });
    }

    return this.chaos.setGuildData(guild.id, DataKeys.broadcastChannelId(broadcastType), channel.id).pipe(
      flatMap(() => channel.send(`I will send ${broadcastType} broadcasts here.`)),
      map(() => ({
        content: `I have enabled ${broadcastType} broadcasts in the channel ${channel}`,
      })),
      catchError((error) => {
        switch (error.name) {
          case 'DiscordAPIError':
            if (error.message === "Missing Permissions") {
              return of({
                status: 400,
                content: `Whoops, I do not have permission to talk in that channel.`,
              });
            } else {
              return throwError(error);
            }
          default:
            return throwError(error);
        }
      }),
    );
  },
};
