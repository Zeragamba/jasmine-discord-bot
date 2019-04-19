module.exports = {
  name: 'topics',
  description: "Allow users to create new channels to discuss topics",

  services: [
    require('./services/topic-service'),
  ],
  commands: [
    require('./commands/topic'),
    require('./commands/rename'),
    require('./commands/close'),
    require('./commands/reopen'),
  ],
};
