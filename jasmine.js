const Nix = require('nix-core');
const Path = require('path');
const fs = require('fs');

const packageJson = require('./package');

class Jasmine extends Nix {
  constructor(config) {
    super({
      ...Jasmine.defaultConfig,
      ...config,
    });

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
    fs.readdirSync(Path.join(__dirname, './plugins'))
      .forEach((file) => {
        this.addPlugin(require('./plugins/' + file));
      });
  }

  listen(next = undefined, error = undefined, complete = undefined) {
    let listen$ = super.listen(next, error, complete);

    listen$.subscribe(() => this.discord.user.setPresence({
      game: {
        name: `v${packageJson.version}`,
      },
    }));

    return listen$;
  }
}

module.exports = Jasmine;
