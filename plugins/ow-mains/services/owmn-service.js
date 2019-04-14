const Service = require('chaos-core').Service;

class OwmnService extends Service {
  isOwmnGuild(guild) {
    return guild.id === this.chaos.owmnServerId;
  }
}

module.exports = OwmnService;