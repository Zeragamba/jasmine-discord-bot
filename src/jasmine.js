const ChaosCore = require('chaos-core');
const Path = require('path');

const packageJson = require('../package');

const plugins = [
  require("chaos-plugin-auto-role"),
  require("chaos-plugin-user-roles"),
  require('./plugins/autoban'),
  require('./plugins/mod-tools'),
  require('./plugins/ow-info'),
  require('./plugins/ow-mains'),
  require('./plugins/streaming'),
  require('./plugins/topics'),
];

const defaultConfig = {
  ownerUserId: null,
  loginToken: null,

  logger: {
    level: 'info',
  },

  dataSource: {
    type: 'disk',
    dataDir: Path.join(__dirname, '../data'),
  },

  broadcastTokens: {},
  networkModLogToken: null,
};

class Jasmine extends ChaosCore {
  constructor(config) {
    super({
      ...defaultConfig,
      ...config,
      plugins,
    });

    if (!this.config.owmnServerId) {
      throw new Error("owmnServerId is required");
    }

    this.on('chaos.listen', () => this.discord.user.setPresence({
      game: {
        name: `v${packageJson.version}`,
      },
    }));
  }
}

module.exports = Jasmine;
