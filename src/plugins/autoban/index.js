module.exports = {
  name: 'autoban',
  description: "Provides automatic banning of users with links in their name",
  services: [
    require('./services/auto-ban-service'),
  ],
  configActions: [
    require('./config/disable'),
    require('./config/enable'),
    require('./config/list'),
  ],
};
