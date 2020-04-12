const {LOG_TYPES} = require('../utility');

const VALID_LOG_TYPES_NAMES = LOG_TYPES.map((t) => t.name);

module.exports = {
  name: 'disableLog',
  description: 'disable a log, such as the ModLog or the JoinLog',

  args: [
    {
      name: 'type',
      description: `the log type to remove. Valid types: ${VALID_LOG_TYPES_NAMES.join(',')}`,
      required: true,
    },
  ],

  async run(context) {
    let modLogService = this.chaos.getService('modTools', 'ModLogService');

    let guild = context.guild;
    let logTypeName = context.args.type;

    let logType = modLogService.getLogType(logTypeName);
    if (!logType) {
      return {
        status: 400,
        content: `${logTypeName} is not a valid log type. Valid types: ${VALID_LOG_TYPES_NAMES.join(',')}`,
      };
    }

    await this.setGuildData(guild.id, logType.channelDatakey, null);
    return {
      status: 200,
      content: `I have disabled the ${logType.name}.`,
    };
  },
};
