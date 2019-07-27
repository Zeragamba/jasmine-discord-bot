/* eslint no-process-exit: off */

const config = require('./config.js');
const Jasmine = require('./src/jasmine');

let jasmine = new Jasmine(config);

jasmine.listen();
