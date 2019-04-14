const ChaosCore = require('chaos-core');
const Jasmine = require('../jasmine');
const localConfig = require('../config');

function stubJasmine(config = {}) {
  const ownerUserId = 'user-00001';

  const stubConfig = {
    ownerUserId: ownerUserId,
    logger: {silent: true},
    dataSource: {type: 'memory'},
  };

  const jasmine = ChaosCore.test.stubChaosBot(new Jasmine({
    ...localConfig,
    ...stubConfig,
    ...config,
  }));

  ChaosCore.test.mocks.discord.build('User', {
    client: jasmine.discord,
    id: ownerUserId,
    setPresence: sinon.fake.resolves(true),
  });

  return jasmine;
}

module.exports = stubJasmine;