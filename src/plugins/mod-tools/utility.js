const DATAKEYS = {
  MOD_LOG_CHANNEL: 'modTools.modLogChannel',
  JOIN_LOG_CHANNEL: 'modTools.joinLogChannel',
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

module.exports = {
  DATAKEYS,
  ERRORS,
  LOG_TYPES,
};
