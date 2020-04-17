const {DATAKEYS} = require('./utility');

module.exports = {
  name: 'modTools',
  description: "Provides server moderation tools like !ban, !kick, and !warn, and can log joins and leaves to a channel.",

  permissionLevels: ['mod'],
  defaultData: [
    {
      keyword: DATAKEYS.MOD_LOG_CHANNEL,
      data: null,
    },
    {
      keyword: DATAKEYS.JOIN_LOG_CHANNEL,
      data: null,
    },
  ],
  services: [
    require('./services/mod-log-service'),
  ],
  configActions: [
    require('./config/disable-log'),
    require('./config/enable-log'),
  ],
  commands: [
    require('./commands/ban'),
    require('./commands/unban'),
    require('./commands/warn'),
  ],
};
