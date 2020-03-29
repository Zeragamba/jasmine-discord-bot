const DataKeys = require('./datakeys');
const configActions = require('./config');

module.exports = {
  name: 'owMains',
  description:
    "Overwatch Mains Network features:\n" +
    "- News broadcasts\n" +
    "- Network ban reports\n",

  permissionLevels: ['broadcaster'],
  defaultData: [
    {keyword: DataKeys.broadcastChannelId('blizzard'), data: null},
    {keyword: DataKeys.broadcastChannelId('network'), data: null},
    {keyword: DataKeys.broadcastChannelId('esports'), data: null},
    {keyword: DataKeys.netModLogChannelId, data: null},
  ],
  services: [
    require('./services/owmn-service'),
    require('./services/net-mod-log-service'),
    require('./services/broadcast-service'),
  ],
  configActions: Object.values(configActions),
  commands: [
    require('./commands/broadcast'),
  ],
};
