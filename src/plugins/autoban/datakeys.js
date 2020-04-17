const RULE_DATAKEY_MAP = {
  banDiscordInvites: 'usernameIsInvite',
  banTwitchLink: 'banTwitchLink',
};

const DATAKEYS = {
  AUTO_BAN_RULE: (rule) => `autoBan.rule.${RULE_DATAKEY_MAP[rule]}`,
};

module.exports = DATAKEYS;
