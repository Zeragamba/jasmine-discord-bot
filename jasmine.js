const {tap} = require('rxjs/operators');
const ChaosCore = require('chaos-core');
const Path = require('path');
const fs = require('fs');

const packageJson = require('./package');

const ChaosPluginAutoRole = require('chaos-plugin-auto-role');

class Jasmine extends ChaosCore {
  constructor(config) {
    super({
      ...Jasmine.defaultConfig,
      ...config,
    });

    if (!this.config.owmnServerId) {
      throw new Error("owmnServerId is required");
    }

    this.loadPlugins();
  }

  static get defaultConfig() {
    return {
      ownerUserId: null,
      loginToken: null,

      logger: {
        level: 'info',
      },

      dataSource: {
        type: 'disk',
        dataDir: Path.join(__dirname, 'data'),
      },

      broadcastTokens: {},
      networkModLogToken: null,
    };
  }

  loadPlugins() {
    this.addPlugin(ChaosPluginAutoRole);

    fs.readdirSync(Path.join(__dirname, './plugins'))
      .forEach((file) => {
        this.addPlugin(require('./plugins/' + file));
      });
  }

  listen() {
    return super.listen().pipe(
      tap(() => this.discord.user.setPresence({
        game: {
          name: `v${packageJson.version}`,
        },
      })),
    );
  }
}

module.exports = Jasmine;
