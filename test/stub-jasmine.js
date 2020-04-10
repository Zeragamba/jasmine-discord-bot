const ChaosCore = require("chaos-core");
const Discord = require('discord.js');
const Jasmine = require('../src/jasmine');
const localConfig = require('../config');

function stubJasmine(config = {}) {
  const ownerUserId = 'user-00001';

  const stubConfig = {
    ownerUserId: ownerUserId,
    logger: {level: 'warn'},
    dataSource: {type: 'memory'},

    owmnServerId: Discord.SnowflakeUtil.generate(),
  };

  const jasmine = ChaosCore.test.stubChaosBot(new Jasmine({
    ...localConfig,
    ...stubConfig,
    ...config,
  }));

  jasmine.discord.user = {
    setPresence: () => Promise.resolve(true),
  };

  return jasmine;
}

module.exports = stubJasmine;
