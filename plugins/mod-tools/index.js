const glob = require('glob');

const {
  DATAKEYS,
  AUTO_BAN_RULES,
} = require('./utility');

module.exports = {
  name: 'modTools',
  description: "Provides server moderation tools like !ban, !kick, and !warn, and can log joins and leaves to a channel.",

  permissions: ['mod'],
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
  services: glob
    .sync(`${__dirname}/services/**/*.js`)
    .map((filename) => require(filename)),
  configActions: glob
    .sync(`${__dirname}/config/**/*.js`)
    .map((filename) => require(filename)),
  commands: glob
    .sync(`${__dirname}/commands/**/*.js`)
    .map((filename) => require(filename)),
};
