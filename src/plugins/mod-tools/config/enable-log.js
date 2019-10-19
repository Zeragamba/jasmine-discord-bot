const {of, throwError} = require('rxjs');
const {flatMap, map, catchError} = require('rxjs/operators');

const {LOG_TYPES} = require('../utility');

const VALID_LOG_TYPES_NAMES = LOG_TYPES.map((t) => t.name);

module.exports = {
  name: 'enableLog',
  description: 'Enable a log in a channel, such as the ModLog or the JoinLog',

  args: [
    {
      name: 'type',
      description: `the log type to add. Valid types: ${VALID_LOG_TYPES_NAMES.join(',')}`,
      required: true,
    },
    {
      name: 'channel',
      description: 'the channel to set the mod log to',
      required: true,
    },
  ],

  run(context) {
    let modLogService = this.chaos.getService('modTools', 'ModLogService');

    let guild = context.guild;
    let logTypeName = context.args.type;
    let channelString = context.args.channel;

    let channel = guild.channels.find((c) => c.toString() === channelString || c.id.toString() === channelString);
    if (!channel) {
      return of({
        content: "I was not able to find that channel",
      });
    }

    let logType = modLogService.getLogType(logTypeName);
    if (!logType) {
      return of({
        content: `${logTypeName} is not a valid log type. Valid types: ${VALID_LOG_TYPES_NAMES.join(', ')}`,
      });
    }

    return this.chaos.setGuildData(guild.id, logType.channelDatakey, channel.id).pipe(
      flatMap(() => channel.send(`I will post the ${logType.name} here now.`)),
      map(() => ({
        content: `I have enabled the ${logType.name} in the channel ${channel}`,
      })),
      catchError((error) => {
        switch (error.name) {
          case 'DiscordAPIError':
            if (error.message === "Missing Access") {
              return of({
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
