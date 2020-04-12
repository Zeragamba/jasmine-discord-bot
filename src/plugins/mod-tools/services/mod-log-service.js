const {of, throwError, range, zip, timer} = require('rxjs');
const {flatMap, map, retryWhen} = require('rxjs/operators');
const Discord = require('discord.js');
const ChaosCore = require('chaos-core');

const AuditLogActions = Discord.GuildAuditLogs.Actions;

const {
  ERRORS,
  LOG_TYPES,
} = require('../utility');

class AuditLogReadError extends ChaosCore.errors.ChaosError {
}

class ModLogService extends ChaosCore.Service {
  constructor(chaos) {
    super(chaos);

    this.chaos.on("guildMemberAdd", async (member) => await this.handleGuildMemberAdd(member).toPromise());
    this.chaos.on("guildMemberRemove", async (member) => await this.handleGuildMemberRemove(member).toPromise());
    this.chaos.on("guildBanAdd", async ([guild, user]) => await this.handleGuildBanAdd(guild, user).toPromise());
    this.chaos.on("guildBanRemove", async ([guild, user]) => await this.handleGuildBanRemove(guild, user).toPromise());
  }

  async handleGuildMemberAdd(member) {
    this.chaos.logger.debug(`[ModLog:${member.guild.name}] User ${member.user.tag} joined`);
    await this.addUserJoinedEntry(member);
  }

  async handleGuildMemberRemove(member) {
    this.chaos.logger.debug(`[ModLog:${member.guild.name}] User ${member.user.tag} left`);
    try {
      const bans = member.guild.fetchBans();
      if (bans.get(member.id)) { return; } // Filter out banned users
    } catch {
      //Error occurred while trying to fetch bans, just continue anyway.
    }
    await this.addUserLeftEntry(member);
  }

  async handleGuildBanAdd(guild, user) {
    this.chaos.logger.debug(`[ModLog:${guild.name}] User ${user.tag} banned`);

    let log;
    try {
      log = await this.findReasonAuditLog(guild, user, {
        type: AuditLogActions.MEMBER_BAN_ADD,
      });
    } catch (error) {
      if (error.name === "TargetMatchError") {
        log = {
          executor: {id: null},
          reason: `ERROR: Unable to find matching log entry`,
        };
      } else if (error.name === "AuditLogReadError") {
        log = {
          executor: {id: null},
          reason: `ERROR: ${error.message}`,
        };
      } else {
        throw error;
      }
    }

    await this.addBanEntry(guild, user, log.reason, log.executor);
  }

  async handleGuildBanRemove(guild, user) {
    this.chaos.logger.debug(`[ModLog:${guild.name}] User ${user.tag} unbanned`);

    let log;
    try {
      log = await this.findReasonAuditLog(guild, user, {
        type: AuditLogActions.MEMBER_BAN_REMOVE,
      });
    } catch (error) {
      if (error.name === "TargetMatchError") {
        log = {
          executor: {id: null},
          reason: `ERROR: Unable to find matching log entry`,
        };
      } else if (error.name === "AuditLogReadError") {
        log = {
          executor: {id: null},
          reason: `ERROR: ${error.message}`,
        };
      } else {
        throw error;
      }
    }

    return this.addUnbanEntry(guild, user, log.executor);
  }

  async addUserJoinedEntry(member) {
    let modLogEmbed = new Discord.RichEmbed();
    modLogEmbed
      .setAuthor(`${member.displayName} joined`, member.user.avatarURL)
      .setColor(Discord.Constants.Colors.AQUA)
      .setDescription(`User ID: ${member.id}`)
      .setTimestamp();

    return this.addLogEntry(member.guild, modLogEmbed, "JoinLog");
  }

  async addUserLeftEntry(member) {
    let modLogEmbed = new Discord.RichEmbed();
    modLogEmbed
      .setAuthor(`${member.displayName} left`, member.user.avatarURL)
      .setColor(Discord.Constants.Colors.GREY)
      .setDescription(`User ID: ${member.id}`)
      .setTimestamp();

    return this.addLogEntry(member.guild, modLogEmbed, "JoinLog");
  }

  async addWarnEntry(guild, user, reason, moderator) {
    let modLogEmbed = new Discord.RichEmbed();
    modLogEmbed
      .setAuthor(`${user.tag} warned`, user.avatarURL)
      .setColor(Discord.Constants.Colors.DARK_GOLD)
      .setDescription(`User ID: ${user.id}\nReason: ${reason || '`None`'}`)
      .addField('Moderator:', moderator ? `${moderator.tag}\nID: ${moderator.id}` : '`unknown`')
      .setTimestamp();

    return this.addLogEntry(guild, modLogEmbed, "ModLog");
  }

  async addBanEntry(guild, user, reason, moderator) {
    let modLogEmbed = new Discord.RichEmbed();
    modLogEmbed
      .setAuthor(`${user.tag} banned`, user.avatarURL)
      .setColor(Discord.Constants.Colors.DARK_RED)
      .setDescription(`User ID: ${user.id}\nReason: ${reason || '`None`'}`)
      .addField('Moderator:', moderator ? `${moderator.tag}\nID: ${moderator.id}` : '`unknown`')
      .setTimestamp();

    return this.addLogEntry(guild, modLogEmbed, "ModLog");
  }

  async addUnbanEntry(guild, user, moderator) {
    let modLogEmbed = new Discord.RichEmbed();
    modLogEmbed
      .setAuthor(`${user.tag} unbanned`, user.avatarURL)
      .setColor(Discord.Constants.Colors.DARK_GREEN)
      .setDescription(`User ID: ${user.id}`)
      .addField('Moderator:', moderator ? `${moderator.tag}\nID: ${moderator.id}` : '`unknown`')
      .setTimestamp();

    return this.addLogEntry(guild, modLogEmbed, "ModLog");
  }

  async addLogEntry(guild, embed, logTypeName) {
    this.chaos.logger.debug(`Adding mod log entry`);

    let logType = this.getLogType(logTypeName);
    if (!logType) { throw new Error(ERRORS.INVALID_LOG_TYPE); }

    try {
      const channelId = await this.getGuildData(guild.id, logType.channelDatakey).toPromise();
      if (typeof channelId === 'undefined') { return; }

      const channel = guild.channels.find((c) => c.id === channelId);
      if (!channel) { return; }

      await channel.send({embed});
    } catch (error) {
      if (error.message === "Missing Access" || error.message === "Missing Permissions") {
        // Bot does not have permission to send messages, we can ignore.
      } else {
        throw error;
      }
    }
  }

  getLogType(name) {
    return LOG_TYPES.find((type) => type.name.toLowerCase() === name.toLowerCase());
  }

  findReasonAuditLog(guild, target, options) {
    return of('').pipe(
      flatMap(() => this.getLatestAuditLogs(guild, {...options, limit: 1})),
      map((auditEntries) => {
        if (auditEntries.length === 0) {
          let error = new Error("No audit records were found");
          error.name = "NoAuditRecords";
          throw error;
        } else if (auditEntries[0].target.id !== target.id) {
          let error = new Error("Audit log entry does not match the target");
          error.name = "TargetMatchError";
          throw error;
        } else {
          return auditEntries[0];
        }
      }),
      retryWhen((errors$) => {
        return zip(
          range(1, 3),
          errors$,
        ).pipe(
          flatMap(([attempt, error]) => {
            if (attempt === 3) { return throwError(error); }
            switch (error.name) {
              case "TargetMatchError":
              case "NoAuditRecords":
                return timer(500);
              default:
                return throwError(error);
            }
          }),
        );
      }),
    );
  }

  async getLatestAuditLogs(guild, options = {}) {
    let canViewAuditLog = guild.member(this.chaos.discord.user).hasPermission(Discord.Permissions.FLAGS.VIEW_AUDIT_LOG);
    if (!canViewAuditLog) {
      throw new AuditLogReadError(`Unable to view audit log. I need the 'View Audit Log' permission in '${guild.name}'`);
    }

    const logs = await guild.fetchAuditLogs({limit: 1, ...options});
    return logs.entries.array();
  }
}

module.exports = ModLogService;
