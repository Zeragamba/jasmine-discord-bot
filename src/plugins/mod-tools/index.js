const {
  DATAKEYS,
  AUTO_BAN_RULES,
} = require('./utility');

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
    {
      keyword: DATAKEYS.AUTO_BAN_ENABLED,
      data: true,
    },
    {
      keyword: DATAKEYS.AUTO_BAN_RULE(AUTO_BAN_RULES.BAN_DISCORD_INVITE),
      data: true,
    },
    {
      keyword: DATAKEYS.AUTO_BAN_RULE(AUTO_BAN_RULES.BAN_TWITCH_LINK),
      data: true,
    },
  ],
  services: [
    require('./services/auto-ban-service'),
    require('./services/mod-log-service'),
  ],
  configActions: [
    require('./config/disable-auto-ban'),
    require('./config/disable-log'),
    require('./config/enable-auto-ban'),
    require('./config/enable-log'),
    require('./config/list-auto-ban-rules'),
    require('./config/set-auto-ban-rule'),
  ],
  commands: [
    require('./commands/ban'),
    require('./commands/unban'),
    require('./commands/warn'),
  ],
};
