const Rx = require('rx');
const Discord = require('discord.js');
const Service = require('chaos-core').Service;

const AuditLogActions = Discord.GuildAuditLogs.Actions;

const {
  ERRORS,
  LOG_TYPES,
} = require('../utility');

class ModLogService extends Service {
  onListen() {
    this.chaos.logger.debug('Adding listener for guildMemberAdd$ events');
    this.chaos.streams
      .guildMemberAdd$
      .flatMap((member) => this.handleGuildMemberAdd(member))
      .subscribe();

    this.chaos.logger.debug('Adding listener for guildMemberRemove$ events');
    this.chaos.streams
      .guildMemberRemove$
      .flatMap((member) => this.handleGuildMemberRemove(member))
      .subscribe();

    this.chaos.logger.debug('Adding listener for guildBanAdd$ events');
    this.chaos.streams
      .guildBanAdd$
      .flatMap(([guild, user]) => this.handleGuildBanAdd(guild, user))
      .subscribe();

    this.chaos.logger.debug('Adding listener for guildBanRemove$ events');
    this.chaos.streams
      .guildBanRemove$
      .flatMap(([guild, user]) => this.handleGuildBanRemove(guild, user))
      .subscribe();

    return Rx.Observable.of(true);
  }

  handleGuildMemberAdd(member) {
    return Rx.Observable
      .of('')
      .do(() => this.chaos.logger.debug(`[ModLog:${member.guild.name}] User ${member.user.tag} joined`))
      .flatMap(() => this.addUserJoinedEntry(member))
      .catch((error) => {
        this.chaos.handleError(error, [
          {name: "Service", value: "ModLogService"},
          {name: "Hook", value: "GuildMemberAdd"},
          {name: "User that joined", value: member.toString()},
          {name: "Guild", value: member.guild.toString()},
        ]);
        return Rx.Observable.empty();
      });
  }

  handleGuildMemberRemove(member) {
    return Rx.Observable
      .of('')
      .do(() => this.chaos.logger.debug(`[ModLog:${member.guild.name}] User ${member.user.tag} left`))
      .flatMap(() =>
        //filter out members who are banned
        Rx.Observable
          .fromPromise(member.guild.fetchBans())
          .map((bans) => bans.get(member.id))
          .filter((bannedUser) => !bannedUser)
          .map(member)
          .catch(() => Rx.Observable.of(member)), //Error occurred while trying to fetch bans, just continue anyway.
      )
      .flatMap(() => this.addUserLeftEntry(member))
      .catch((error) => {
        this.chaos.handleError(error, [
          {name: "Service", value: "ModLogService"},
          {name: "Hook", value: "GuildMemberRemove"},
          {name: "User that left", value: member.toString()},
          {name: "Guild", value: member.guild.toString()},
        ]);
        return Rx.Observable.empty();
      });
  }

  handleGuildBanAdd(guild, user) {
    return Rx.Observable
      .of('')
      .do(() => this.chaos.logger.debug(`[ModLog:${guild.name}] User ${user.tag} banned`))
      .flatMap(() => this.findReasonAuditLog(guild, user, {
        type: AuditLogActions.MEMBER_BAN_ADD,
      }))
      .catch((error) => {
        switch (error.name) {
          case "TargetMatchError":
            return Rx.Observable.of({
              executor: {id: null},
              reason: `ERROR: Unable to find matching log entry`,
            });
          case "AuditLogReadError":
            return Rx.Observable.of({
              executor: {id: null},
              reason: `ERROR: ${error.message}`,
            });
          default:
            return Rx.Observable.throw(error);
        }
      })
      .flatMap((log) => this.addBanEntry(guild, user, log.reason, log.executor))
      .catch((error) => {
        this.chaos.handleError(error, [
          {name: "Service", value: "ModLogService"},
          {name: "Hook", value: "guildBanAdd"},
          {name: "Banned User", value: user.toString()},
          {name: "Guild", value: guild.toString()},
        ]);
        return Rx.Observable.empty();
      });
  }

  handleGuildBanRemove(guild, user) {
    return Rx.Observable
      .of('')
      .do(() => this.chaos.logger.debug(`[ModLog:${guild.name}] User ${user.tag} unbanned`))
      .flatMap(() => this.findReasonAuditLog(guild, user, {
        type: AuditLogActions.MEMBER_BAN_REMOVE,
      }))
      .catch((error) => {
        switch (error.name) {
          case "TargetMatchError":
            return Rx.Observable.of({
              executor: {id: null},
              reason: `ERROR: Unable to find matching log entry`,
            });
          case "AuditLogReadError":
            return Rx.Observable.of({
              executor: {id: null},
              reason: `ERROR: ${error.message}`,
            });
          default:
            return Rx.Observable.throw(error);
        }
      })
      .flatMap((log) => this.addUnbanEntry(guild, user, log.executor))
      .catch((error) => {
        this.chaos.handleError(error, [
          {name: "Service", value: "ModLogService"},
          {name: "Hook", value: "guildBanRemove"},
          {name: "Unbanned User", value: user.toString()},
          {name: "Guild", value: guild.toString()},
        ]);
        return Rx.Observable.empty();
      });
  }

  addUserJoinedEntry(member) {
    let modLogEmbed = new Discord.RichEmbed();
    modLogEmbed
      .setAuthor(`${member.displayName} joined`, member.user.avatarURL)
      .setColor(Discord.Constants.Colors.AQUA)
      .setDescription(`User ID: ${member.id}`)
      .setTimestamp();

    return this.addLogEntry(member.guild, modLogEmbed, "JoinLog");
  }

  addUserLeftEntry(member) {
    let modLogEmbed = new Discord.RichEmbed();
    modLogEmbed
      .setAuthor(`${member.displayName} left`, member.user.avatarURL)
      .setColor(Discord.Constants.Colors.GREY)
      .setDescription(`User ID: ${member.id}`)
      .setTimestamp();

    return this.addLogEntry(member.guild, modLogEmbed, "JoinLog");
  }

  addWarnEntry(guild, user, reason, moderator) {
    let modLogEmbed = new Discord.RichEmbed();
    modLogEmbed
      .setAuthor(`${user.tag} warned`, user.avatarURL)
      .setColor(Discord.Constants.Colors.DARK_GOLD)
      .setDescription(`User ID: ${user.id}\nReason: ${reason || '`None`'}`)
      .addField('Moderator:', moderator ? `${moderator.tag}\nID: ${moderator.id}` : '`unknown`')
      .setTimestamp();

    return this.addLogEntry(guild, modLogEmbed, "ModLog");
  }

  addBanEntry(guild, user, reason, moderator) {
    let modLogEmbed = new Discord.RichEmbed();
    modLogEmbed
      .setAuthor(`${user.tag} banned`, user.avatarURL)
      .setColor(Discord.Constants.Colors.DARK_RED)
      .setDescription(`User ID: ${user.id}\nReason: ${reason || '`None`'}`)
      .addField('Moderator:', moderator ? `${moderator.tag}\nID: ${moderator.id}` : '`unknown`')
      .setTimestamp();

    return this.addLogEntry(guild, modLogEmbed, "ModLog");
  }

  addUnbanEntry(guild, user, moderator) {
    let modLogEmbed = new Discord.RichEmbed();
    modLogEmbed
      .setAuthor(`${user.tag} unbanned`, user.avatarURL)
      .setColor(Discord.Constants.Colors.DARK_GREEN)
      .setDescription(`User ID: ${user.id}`)
      .addField('Moderator:', moderator ? `${moderator.tag}\nID: ${moderator.id}` : '`unknown`')
      .setTimestamp();

    return this.addLogEntry(guild, modLogEmbed, "ModLog");
  }

  addLogEntry(guild, embed, logTypeName) {
    this.chaos.logger.debug(`Adding mod log entry`);

    let logType = this.getLogType(logTypeName);
    if (!logType) { throw new Error(ERRORS.INVALID_LOG_TYPE); }

    return this.chaos
      .getGuildData(guild.id, logType.channelDatakey)
      .filter((channelId) => typeof channelId !== 'undefined')
      .map((channelId) => guild.channels.find((c) => c.id === channelId))
      .filter((channel) => channel !== null)
      .flatMap((channel) => channel.send({embed}))
      .catch((error) => {
        if (error.name === 'DiscordAPIError') {
          if (error.message === "Missing Access" || error.message === "Missing Permissions") {
            // Bot does not have permission to send messages, we can ignore.
            return Rx.Observable.empty();
          }
        }

        // Error was not handled, rethrow it
        return Rx.Observable.throw(error);
      })
      .map(true)
      .defaultIfEmpty(true);
  }

  getLogType(name) {
    return LOG_TYPES.find((type) => type.name.toLowerCase() === name.toLowerCase());
  }

  findReasonAuditLog(guild, target, options) {
    return Rx.Observable.of('')
      .flatMap(() => this.getLatestAuditLogs(guild, {...options, limit: 1}))
      .map((auditEntry) => {
        if (auditEntry.target.id !== target.id) {
          let error = new Error("Audit log entry does not match the target");
          error.name = "TargetMatchError";
          throw error;
        }
        return auditEntry;
      })
      .retryWhen((error$) => {
        return Rx.Observable.range(1, 3)
          .zip(error$)
          .flatMap(([attempt, error]) => {
            if (attempt === 3) {
              return Rx.Observable.throw(error);
            }
            if (error.name === "TargetMatchError") {
              return Rx.Observable.timer(500);
            }
            return Rx.Observable.throw(error);
          });
      });
  }

  getLatestAuditLogs(guild, options = {}) {
    let filter = Object.assign({
      limit: 1,
    }, options);

    let canViewAuditLog = guild.member(this.chaos.discord.user).hasPermission(Discord.Permissions.FLAGS.VIEW_AUDIT_LOG);
    if (!canViewAuditLog) {
      let error = new Error(`Unable to view audit log. I need the 'View Audit Log' permission in '${guild.name}'`);
      error.name = "AuditLogReadError";
      return Rx.Observable.throw(error);
    }

    return Rx.Observable
      .fromPromise(guild.fetchAuditLogs(filter))
      .flatMap((logs) => Rx.Observable.from(logs.entries.array()));
  }
}

module.exports = ModLogService;
