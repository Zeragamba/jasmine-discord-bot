const chai = require('chai');
const chaiSubset = require('chai-subset');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

const stubJasmine = require('./stub-jasmine');
const observableMatchers = require('./observable-matchers');

chai.use(sinonChai);
chai.use(chaiSubset);
chai.use(observableMatchers);

global.sinon = sinon;
global.expect = chai.expect;

global.stubJasmine = stubJasmine;
