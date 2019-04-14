const Service = require('chaos-core').Service;

class OwmnService extends Service {
  isOwmnGuild(guild) {
    const guildIsOwmn = guild.id === this.chaos.config.owmnServerId;
    this.chaos.logger.debug(`is guild ${guild.id} OWMN (${this.chaos.owmnServerId}): ${guildIsOwmn}`);
    return guildIsOwmn;
  }
}

module.exports = OwmnService;