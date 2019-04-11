const Rx = require('rx');
const Service = require('nix-core').Service;
const DiscordAPIError = require('discord.js').DiscordAPIError;

const DATAKEYS = require('../lib/datakeys');
const { RoleNotFoundError } = require('../lib/errors');

function logPrefix(member) {
  return `[Streaming:${member.guild.name}:${member.user.tag}]`;
}

class StreamingService extends Service {
  configureService() {
    this.pluginService = this.nix.getService('core', 'PluginService');
  }

  onNixListen() {
    this.nix.streams
      .presenceUpdate$
      .flatMap(([oldMember, newMember]) => this.handlePresenceUpdate(oldMember, newMember))
      .subscribe();
  }

  handlePresenceUpdate(oldMember, newMember) {
    this.nix.logger.debug(`${logPrefix(newMember)} Handling presence update for ${newMember.user.tag} in ${newMember.guild.name}`);
    return Rx.Observable.merge(
        this.pluginService.isPluginEnabled(newMember.guild.id, 'streaming')
          .do((moduleEnabled) => this.nix.logger.debug(`${logPrefix(newMember)} Module is ${moduleEnabled ? "enabled" : "disabled"} in ${newMember.guild.name}`)),
        this.getLiveRole(newMember.guild)
          .do((liveRole) => this.nix.logger.debug(`${logPrefix(newMember)} Live role in ${newMember.guild.name} is ${liveRole ? liveRole.name : "<none>"}`)),
        this.memberIsStreamer(newMember)
          .do((isStreamer) => this.nix.logger.debug(`${logPrefix(newMember)} ${newMember.user.tag} ${isStreamer ? "is" : "is not"} a streamer.`)),
      )
      .every((checkPassed) => checkPassed)
      .filter(Boolean)
      .flatMap(() => this.updateMemberRoles(newMember))
      .catch((error) => {
        if (error instanceof DiscordAPIError) {
          this.nix.logger.debug(`${logPrefix(newMember)} Ignored discord error: ${error.toString()}`);
          return Rx.Observable.empty();
        }

        return this.nix.handleError(error, [
          { name: "Service", value: "StreamingService" },
          { name: "Hook", value: "presenceUpdate$" },
          { name: "Guild", value: newMember.guild.toString() },
          { name: "Member", value: newMember.toString() },
        ]).ignoreElements();
      });
  }

  memberIsStreamer(member) {
    return this.getStreamerRole(member.guild)
      .filter((streamerRole) => streamerRole)
      .map((streamerRole) => member.roles.has(streamerRole.id))
      .defaultIfEmpty(true); // If no streamerRole set, then the member is a streamer
  }

  updateMemberRoles(member) {
    this.nix.logger.debug(`${logPrefix(member)} Will update roles for ${member.user.tag}`);
    return Rx.Observable.of('')
      .map(() => this.memberIsStreaming(member))
      .do((isStreaming) => this.nix.logger.debug(`${logPrefix(member)} ${member.user.tag} ${isStreaming ? "is" : "is not"} Streaming`))
      .flatMap((isStreaming) =>
        Rx.Observable.if(
          () => isStreaming,
          this.addLiveRoleToMember(member),
          this.removeLiveRoleFromMember(member),
        ),
      );
  }

  addLiveRoleToMember(member) {
    return Rx.Observable.of('')
      .flatMap(() => this.getLiveRole(member.guild))
      .filter((liveRole) => liveRole)
      .filter((liveRole) => !member.roles.has(liveRole.id))
      .do((liveRole) => this.nix.logger.debug(`${logPrefix(member)} Adding role ${liveRole.name} to ${member.user.tag}`))
      .flatMap((liveRole) => member.addRole(liveRole));
  }

  removeLiveRoleFromMember(member) {
    return Rx.Observable.of('')
      .flatMap(() => this.getLiveRole(member.guild))
      .filter((liveRole) => liveRole)
      .filter((liveRole) => member.roles.has(liveRole.id))
      .do((liveRole) => this.nix.logger.debug(`${logPrefix(member)} Removing role ${liveRole.name} from ${member.user.tag}`))
      .flatMap((liveRole) => member.removeRole(liveRole));
  }

  setLiveRole(guild, role) {
    return this.nix.setGuildData(guild.id, DATAKEYS.LIVE_ROLE, role ? role.id : null)
      .flatMap(() => this.getLiveRole(guild));
  }

  getLiveRole(guild) {
    return this.nix.getGuildData(guild.id, DATAKEYS.LIVE_ROLE)
      .map((roleId) => guild.roles.get(roleId));
  }

  removeLiveRole(guild) {
    return this.getLiveRole(guild)
      .flatMap((oldRole) => this.setLiveRole(guild, null).map(() => oldRole));
  }

  /**
   * Checks if a member is streaming a game
   *
   * @param member {GuildMember}
   * @return {Boolean} true, if the member is streaming
   */
  memberIsStreaming(member) {
    let presence = member.presence;
    if (!presence.game) {
      return false;
    } else {
      return presence.game.streaming;
    }
  }

  setStreamerRole(guild, role) {
    return this.nix.setGuildData(guild.id, DATAKEYS.STREAMER_ROLE, role ? role.id : null)
      .flatMap(() => this.getStreamerRole(guild));
  }

  getStreamerRole(guild) {
    return this.nix.getGuildData(guild.id, DATAKEYS.STREAMER_ROLE)
      .map((roleId) => guild.roles.get(roleId));
  }

  removeStreamerRole(guild) {
    return this.getStreamerRole(guild)
      .map((oldRole) => {
        if (oldRole) {
          return oldRole;
        }
        else {
          throw new RoleNotFoundError('No streamer role set.');
        }
      })
      .flatMap((oldRole) => this.setStreamerRole(guild, null).map(() => oldRole));
  }
}

module.exports = StreamingService;
