const glob = require('glob');

const DATAKEYS = require('./lib/datakeys');

const NOT_TEST_FILES_REGEX = /^(?!.*test\.js).*\.js$/;

module.exports = {
  name: 'streaming',
  description: "Automatically assigns a role when a user starts streaming.",

  defaultData: [
    { keyword: DATAKEYS.LIVE_ROLE, data: null },
    { keyword: DATAKEYS.STREAMER_ROLE, data: null },
  ],
  services: glob
    .sync(`${__dirname}/services/**/*.js`)
    .filter((filename) => NOT_TEST_FILES_REGEX.test(filename))
    .map((filename) => require(filename)),
  configActions: glob
    .sync(`${__dirname}/config/**/*.js`)
    .filter((filename) => NOT_TEST_FILES_REGEX.test(filename))
    .map((filename) => require(filename)),
  commands: glob
    .sync(`${__dirname}/commands/**/*.js`)
    .filter((filename) => NOT_TEST_FILES_REGEX.test(filename))
    .map((filename) => require(filename)),
};
