const ChaosCore = require('chaos-core');
const Jasmine = require('../jasmine');
const localConfig = require('../config');

function stubJasmine(config = {}) {
  const ownerUserId = 'user-00001';

  const stubConfig = {
    ownerUserId: ownerUserId,
    logger: {level: 'warn'},
    dataSource: {type: 'memory'},
  };

  return ChaosCore.test.stubChaosBot(new Jasmine({
    ...localConfig,
    ...stubConfig,
    ...config,
  }));
}

module.exports = stubJasmine;