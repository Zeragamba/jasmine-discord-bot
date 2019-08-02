const Service = require('chaos-core').Service;

class OwmnService extends Service {
  get owmnServerId() {
    return this.chaos.config.owmnServerId;
  }

  get owmnServer() {
    return this.chaos.discord.guilds.get(this.owmnServerId);
  }

  isOwmnGuild(guild) {
    const guildIsOwmn = guild.id === this.owmnServerId;
    this.chaos.logger.debug(`is guild ${guild.id} OWMN (${this.chaos.owmnServerId}): ${guildIsOwmn}`);
    return guildIsOwmn;
  }
}

module.exports = OwmnService;
