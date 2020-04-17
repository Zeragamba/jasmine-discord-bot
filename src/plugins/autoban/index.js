module.exports = {
  name: 'autoban',
  description: "Provides automatic banning of users with links in their name",
  services: [
    require('./services/auto-ban-service'),
  ],
  configActions: [
    require('./config/disable-auto-ban'),
    require('./config/enable-auto-ban'),
    require('./config/list-auto-ban-rules'),
    require('./config/set-auto-ban-rule'),
  ],
};
