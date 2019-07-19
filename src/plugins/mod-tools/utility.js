const DATAKEYS = {
  MOD_LOG_CHANNEL: 'modTools.modLogChannel',
  JOIN_LOG_CHANNEL: 'modTools.joinLogChannel',
  AUTO_BAN_ENABLED: 'modTools.autoBan.enabled',
  AUTO_BAN_RULE: (rule) => `modTools.autoBan.rule.${RULE_DATAKEY_MAP[rule]}`,
};

const ERRORS = {
  USER_NOT_FOUND: "User could not be found.",
  USER_ALREADY_BANNED: "User is already banned.",
  INVALID_LOG_TYPE: "Invalid log type.",
};

const LOG_TYPES = [
  {
    name: 'ModLog',
    channelDatakey: DATAKEYS.MOD_LOG_CHANNEL,
  },
  {
    name: 'JoinLog',
    channelDatakey: DATAKEYS.JOIN_LOG_CHANNEL,
  },
];

const RULE_DATAKEY_MAP = {
  banDiscordInvites: 'usernameIsInvite',
  banTwitchLink: 'banTwitchLink',
};

const AUTO_BAN_RULES = {
  BAN_DISCORD_INVITE: 'banDiscordInvites',
  BAN_TWITCH_LINK: 'banTwitchLink',
};

module.exports = {
  DATAKEYS,
  ERRORS,
  LOG_TYPES,
  AUTO_BAN_RULES,
};
