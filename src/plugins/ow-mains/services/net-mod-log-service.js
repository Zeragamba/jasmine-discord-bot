const Discord = require('discord.js');
const Service = require('chaos-core').Service;

const DataKeys = require('../datakeys');
const AuditLogActions = Discord.GuildAuditLogs.Actions;

class NetModLogService extends Service {
  constructor(chaos) {
    super(chaos);

    this.chaos.on("chaos.startup", () => {
      this.modLogService = this.chaos.getService('modTools', 'ModLogService');
      this.owmnService = this.chaos.getService('owMains', 'owmnService');
    });

    this.chaos.on("guildBanAdd", async ([guild, user]) => await this.handleGuildBanAdd(guild, user));
    this.chaos.on("guildBanRemove", async ([guild, user]) => await this.handleGuildBanRemove(guild, user));
  }

  async handleGuildBanAdd(guild, user) {
    let log;
    try {
      log = await this.modLogService.findReasonAuditLog(
        guild, user, {type: AuditLogActions.MEMBER_BAN_ADD},
      );
    } catch (error) {
      if (error.name === "TargetMatchError") {
        log = {
          executor: {id: null},
          reason: `ERROR: Unable to find matching log entry`,
        };
      } else if (error.name === "NoAuditRecords" || error.name === "AuditLogReadError") {
        log = {
          executor: {id: null},
          reason: `ERROR: ${error.message}`,
        };
      } else {
        throw error;
      }
    }

    if (log.reason && log.reason.match(/\[AutoBan]/i)) {
      return;
    }

    if (log.executor.id === this.chaos.discord.user.id) {
      //the ban was made by Jasmine, strip the moderator from the reason
      log.reason = log.reason.replace(/\| Banned.*$/, '');
    }

    this.logger.debug(`NetModLog: User ${user.tag} banned in ${guild.id} for reason: ${log.reason}`);
    await this.addBanEntry(guild, user, log.reason);
  }

  async handleGuildBanRemove(guild, user) {
    this.logger.debug(`NetModLog: User ${user.tag} unbanned in ${guild.id}`);
    await this.addUnbanEntry(guild, user);
  }

  async addBanEntry(guild, user, reason) {
    let modLogEmbed = new Discord.RichEmbed();

    modLogEmbed
      .setAuthor(`${user.tag} banned from ${guild.name}`, user.avatarURL)
      .setColor(Discord.Constants.Colors.DARK_RED)
      .setDescription(`User ID: ${user.id}\nReason: ${reason || '`None`'}`)
      .setTimestamp();

    return this.addAuditEntry(guild, modLogEmbed);
  }

  async addUnbanEntry(guild, user) {
    let modLogEmbed = new Discord.RichEmbed();

    modLogEmbed
      .setAuthor(`${user.tag} unbanned from ${guild.name}`, user.avatarURL)
      .setColor(Discord.Constants.Colors.DARK_GREEN)
      .setDescription(`User ID: ${user.id}`)
      .setTimestamp();

    return this.addAuditEntry(guild, modLogEmbed);
  }

  async addAuditEntry(fromGuild, embed) {
    this.logger.debug(`Adding network mod log entry`);

    const channelId = await this.getGuildData(this.owmnService.owmnServer.id, DataKeys.netModLogChannelId);
    const channel = this.owmnService.owmnServer.channels.get(channelId);
    if (!channel) return;

    try {
      await channel.send({embed});
    } catch (error) {
      if (error.message === "Missing Access" || error.message === "Missing Permissions") {
        // Bot does not have permission to send messages, we can ignore.

      } else {
        throw error;
      }
    }
  }
}

module.exports = NetModLogService;
