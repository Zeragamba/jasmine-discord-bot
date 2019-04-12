const Rx = require('rx');
const { LOG_TYPES } = require('../utility');

const VALID_LOG_TYPES_NAMES = LOG_TYPES.map((t) => t.name);

module.exports = {
  name: 'enableLog',
  description: 'Enable a log in a channel, such as the ModLog or the JoinLog',

  inputs: [
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
    let modLogService = context.chaos.getService('modTools', 'ModLogService');

    let guild = context.guild;
    let logTypeName = context.inputs.type;
    let channelString = context.inputs.channel;

    let channel = guild.channels.find((c) => c.toString() === channelString || c.id.toString() === channelString);
    if (!channel) {
      return Rx.Observable.of({
        content: "I was not able to find that channel",
      });
    }

    let logType = modLogService.getLogType(logTypeName);
    if (!logType) {
      return Rx.Observable.of({
        content: `${logTypeName} is not a valid log type. Valid types: ${VALID_LOG_TYPES_NAMES.join(', ')}`,
      });
    }

    return this.chaos
      .setGuildData(guild.id, logType.channelDatakey, channel.id)
      .flatMap(() => channel.send(`I will post the ${logType.name} here now.`))
      .map(() => ({
        content: `I have enabled the ${logType.name} in the channel ${channel}`,
      }))
      .catch((error) => {
        switch (error.name) {
          case 'DiscordAPIError':
            if (error.message === "Missing Access") {
              return Rx.Observable.of({
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
