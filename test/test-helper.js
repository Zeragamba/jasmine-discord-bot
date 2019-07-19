const ChaosCore = require("chaos-core");
const chai = require('chai');
const chaiSubset = require('chai-subset');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

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

chai.use(sinonChai);
chai.use(chaiSubset);

global.sinon = sinon;
global.expect = chai.expect;

global.stubJasmine = stubJasmine;
