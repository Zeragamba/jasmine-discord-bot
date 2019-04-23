const Rx = require('rx');
const Discord = require('discord.js');
const Service = require('chaos-core').Service;

const DataKeys = require('../datakeys');
const AuditLogActions = Discord.GuildAuditLogs.Actions;

class NetModLogService extends Service {
  onListen() {
    this.modLogService = this.chaos.getService('modTools', 'ModLogService');
    this.owmnService = this.chaos.getService('owMains', 'owmnService');

    this.chaos.logger.debug('Adding listener for netModLog guildBanAdd$ events');
    this.chaos.streams
      .guildBanAdd$
      .flatMap(([guild, user]) => this.handleGuildBanAdd(guild, user))
      .subscribe();

    this.chaos.logger.debug('Adding listener for netModLog guildBanRemove$ events');
    this.chaos.streams
      .guildBanRemove$
      .flatMap(([guild, user]) => this.handleGuildBanRemove(guild, user))
      .subscribe();

    return Rx.Observable.of(true);
  }

  handleGuildBanAdd(guild, user) {
    return Rx.Observable
      .of('')
      .flatMap(() => {
        return this.modLogService
          .findReasonAuditLog(guild, user, {type: AuditLogActions.MEMBER_BAN_ADD})
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
          });
      })
      .filter((log) => !log.reason || !log.reason.match(/\[AutoBan]/i))
      .map((log) => {
        let reason = log.reason;

        if (log.executor.id === this.chaos.discord.user.id) {
          //the ban was made by Jasmine, strip the moderator from the reason
          reason = reason.replace(/\| Banned.*$/, '');
        }

        return {...log, reason};
      })
      .do((log) => this.chaos.logger.debug(`NetModLog: User ${user.tag} banned in ${guild.id} for reason: ${log.reason}`))
      .flatMap((log) => this.addBanEntry(guild, user, log.reason))
      .catch((error) => {
        this.chaos.handleError(error, [
          {name: 'Service', value: 'NetModLogService'},
          {name: 'Hook', value: 'guildBanAdd$'},
          {name: 'Guild Name', value: guild.name},
          {name: 'Guild ID', value: guild.id},
          {name: 'Banned User', value: user.tag.toString()},
        ]);
        return Rx.Observable.empty();
      });
  }

  handleGuildBanRemove(guild, user) {
    return Rx.Observable
      .of('')
      .do(() => this.chaos.logger.debug(`NetModLog: User ${user.tag} unbanned in ${guild.id}`))
      .flatMap(() => this.addUnbanEntry(guild, user))
      .catch((error) => {
        this.chaos.handleError(error, [
          {name: 'Service', value: 'NetModLogService'},
          {name: 'Hook', value: 'guildBanRemove$'},
          {name: 'Guild Name', value: guild.name},
          {name: 'Guild ID', value: guild.id},
          {name: 'Unbanned User', value: user.tag.toString()},
        ]);
        return Rx.Observable.empty();
      });
  }

  addBanEntry(guild, user, reason) {
    let modLogEmbed = new Discord.RichEmbed();
    modLogEmbed
      .setAuthor(`${user.tag} banned from ${guild.name}`, user.avatarURL)
      .setColor(Discord.Constants.Colors.DARK_RED)
      .setDescription(`User ID: ${user.id}\nReason: ${reason || '`None`'}`)
      .setTimestamp();

    return this.addAuditEntry(guild, modLogEmbed);
  }

  addUnbanEntry(guild, user) {
    let modLogEmbed = new Discord.RichEmbed();
    modLogEmbed
      .setAuthor(`${user.tag} unbanned from ${guild.name}`, user.avatarURL)
      .setColor(Discord.Constants.Colors.DARK_GREEN)
      .setDescription(`User ID: ${user.id}`)
      .setTimestamp();

    return this.addAuditEntry(guild, modLogEmbed);
  }

  addAuditEntry(fromGuild, embed) {
    this.chaos.logger.debug(`Adding network mod log entry`);

    return Rx.Observable.of('')
      .flatMap(() => this.chaos.getGuildData(this.owmnService.owmnServer.id, DataKeys.netModLogChannelId))
      .map((channelId) => this.owmnService.owmnServer.channels.get(channelId))
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
}

module.exports = NetModLogService;
