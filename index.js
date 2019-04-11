/* eslint no-process-exit: off */

const config = require('./config.js');
const Jasmine = require('./jasmine');

let jasmine = new Jasmine(config);

jasmine.listen()
  .subscribe(
    () => {},
    () => process.exit(1),
    () => process.exit(0),
  );
