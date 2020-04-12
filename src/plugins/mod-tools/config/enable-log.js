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

  async run(context) {
    let modLogService = this.chaos.getService('modTools', 'ModLogService');

    let guild = context.guild;
    let logTypeName = context.args.type;
    let channelString = context.args.channel;

    let channel = guild.channels.find((c) => c.toString() === channelString || c.id.toString() === channelString);
    if (!channel) {
      return {
        content: "I was not able to find that channel",
      };
    }

    let logType = modLogService.getLogType(logTypeName);
    if (!logType) {
      return {
        content: `${logTypeName} is not a valid log type. Valid types: ${VALID_LOG_TYPES_NAMES.join(', ')}`,
      };
    }

    try {
      await this.setGuildData(guild.id, logType.channelDatakey, channel.id);
      await channel.send(`I will post the ${logType.name} here now.`);
      return {
        content: `I have enabled the ${logType.name} in the channel ${channel}`,
      };
    } catch (error) {
      if (error.message === "Missing Access") {
        return {
          content: `Whoops, I do not have permission to talk in that channel.`,
        };
      } else {
        throw error;
      }
    }
  },
};
