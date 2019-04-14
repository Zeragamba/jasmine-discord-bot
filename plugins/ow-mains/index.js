const DataKeys = require('./datakeys');

module.exports = {
  name: 'owMains',
  permissions: [
    'broadcaster',
  ],
  defaultData: [
    { keyword: DataKeys.broadcastChannelId('blizzard'), data: null },
    { keyword: DataKeys.broadcastChannelId('network'), data: null },
    { keyword: DataKeys.broadcastChannelId('esports'), data: null },
    { keyword: DataKeys.broadcastToken, data: {} },
    { keyword: DataKeys.netModLogChannel, data: null },
    { keyword: DataKeys.netModLogToken, data: null },
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
