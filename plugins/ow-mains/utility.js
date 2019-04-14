const config = require('../../config.js');
const DataKeys = require('./datakeys');

const BROADCAST_TYPES = {
  'blizzard': DataKeys.broadcastChannelId('blizzard'),
  'network': DataKeys.broadcastChannelId('network'),
  'esports': DataKeys.broadcastChannelId('esports'),
};

const BROADCAST_TOKENS = config.broadcastTokens;

const NET_MOD_LOG_TOKEN = config.networkModLogToken;

const ERRORS = {
  TOKEN_INVALID: 'Token is invalid',
};

module.exports = {
  ERRORS,
  BROADCAST_TYPES,
  BROADCAST_TOKENS,
  NET_MOD_LOG_TOKEN,
};
