const DataKeys = require('./datakeys');

module.exports = {
  name: 'owMains',
  permissions: [
    'broadcaster',
  ],
  defaultData: [
    { keyword: DataKeys.BROADCAST('blizzard'), data: null },
    { keyword: DataKeys.BROADCAST('network'), data: null },
    { keyword: DataKeys.BROADCAST('esports'), data: null },
    { keyword: DataKeys.BROADCAST_TOKENS, data: {} },
    { keyword: DataKeys.NET_MOD_LOG, data: null },
    { keyword: DataKeys.NET_MOD_LOG_TOKEN, data: null },
  ],
  services: [
    require('./services/owmn-service'),
    require('./services/net-mod-log-service'),
    require('./services/broadcast-service'),
  ],
  configActions: [
    require('./config/sub-broadcast'),
    require('./config/unsub-broadcast'),
    require('./config/enable-net-mod-log'),
  ],
  commands: [
    require('./commands/broadcast'),
  ],
};
