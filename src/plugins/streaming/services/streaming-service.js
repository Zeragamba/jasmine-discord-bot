const {of, iif, throwError, merge, EMPTY} = require('rxjs');
const {flatMap, tap, map, defaultIfEmpty, catchError, filter, every} = require('rxjs/operators');
const Service = require('../../chaos-core/chaos-core').Service;
const DiscordAPIError = require('discord.js').DiscordAPIError;

const DATAKEYS = require('../lib/datakeys');
const {RoleNotFoundError} = require('../lib/errors');

function logPrefix(member) {
  return `[Streaming:${member.guild.name}:${member.user.tag}]`;
}

class StreamingService extends Service {
  constructor(chaos) {
    super(chaos);

    this.chaos.on('chaos.listen', () => {
      this.pluginService = this.chaos.getService('core', 'PluginService');
    });

    this.chaos.on("presenceUpdate", ([oldMember, newMember]) => this.handlePresenceUpdate(oldMember, newMember));
  }

  handlePresenceUpdate(oldMember, newMember) {
    this.chaos.logger.debug(`${logPrefix(newMember)} Handling presence update for ${newMember.user.tag} in ${newMember.guild.name}`);
    return merge(
      this.pluginService.isPluginEnabled(newMember.guild.id, 'streaming').pipe(
        tap((moduleEnabled) => this.chaos.logger.debug(`${logPrefix(newMember)} Module is ${moduleEnabled ? "enabled" : "disabled"} in ${newMember.guild.name}`)),
      ),
      this.getLiveRole(newMember.guild).pipe(
        tap((liveRole) => this.chaos.logger.debug(`${logPrefix(newMember)} Live role in ${newMember.guild.name} is ${liveRole ? liveRole.name : "<none>"}`)),
      ),
      this.memberIsStreamer(newMember).pipe(
        tap((isStreamer) => this.chaos.logger.debug(`${logPrefix(newMember)} ${newMember.user.tag} ${isStreamer ? "is" : "is not"} a streamer.`)),
      ),
    ).pipe(
      every((checkPassed) => checkPassed),
      filter(Boolean),
      flatMap(() => this.updateMemberRoles(newMember)),
      catchError((error) => {
        if (error instanceof DiscordAPIError) {
          this.chaos.logger.debug(`${logPrefix(newMember)} Ignored discord error: ${error.toString()}`);
          return EMPTY;
        }

        return this.chaos.handleError(error, [
          {name: "Service", value: "StreamingService"},
          {name: "Hook", value: "presenceUpdate$"},
          {name: "Guild", value: newMember.guild.toString()},
          {name: "Member", value: newMember.toString()},
        ]).pipe(
          flatMap(() => EMPTY),
        );
      }),
    );
  }

  memberIsStreamer(member) {
    return this.getStreamerRole(member.guild).pipe(
      filter((streamerRole) => streamerRole),
      map((streamerRole) => member.roles.has(streamerRole.id)),
      defaultIfEmpty(true), // If no streamerRole set, then the member is a streamer
    );
  }

  updateMemberRoles(member) {
    return of('').pipe(
      tap(() => this.chaos.logger.debug(`${logPrefix(member)} Will update roles for ${member.user.tag}`)),
      map(() => this.memberIsStreaming(member)),
      tap((isStreaming) => this.chaos.logger.debug(`${logPrefix(member)} ${member.user.tag} ${isStreaming ? "is" : "is not"} Streaming`)),
      flatMap((isStreaming) => iif(
        () => isStreaming,
        this.addLiveRoleToMember(member),
        this.removeLiveRoleFromMember(member),
      )),
      catchError((error) => {
        if (error instanceof DiscordAPIError) {
          switch (error.message) {
            case "Adding the role timed out.":
            case "Removing the role timed out.":
              //Ignore timeout errors
              return of('');
          }
        }

        return throwError(error);
      }),
    );
  }

  addLiveRoleToMember(member) {
    return of('').pipe(
      flatMap(() => this.getLiveRole(member.guild)),
      filter((liveRole) => liveRole),
      filter((liveRole) => !member.roles.has(liveRole.id)),
      tap((liveRole) => this.chaos.logger.debug(`${logPrefix(member)} Adding role ${liveRole.name} to ${member.user.tag}`)),
      flatMap((liveRole) => member.addRole(liveRole)),
    );
  }

  removeLiveRoleFromMember(member) {
    return of('').pipe(
      flatMap(() => this.getLiveRole(member.guild)),
      filter((liveRole) => liveRole),
      filter((liveRole) => member.roles.has(liveRole.id)),
      tap((liveRole) => this.chaos.logger.debug(`${logPrefix(member)} Removing role ${liveRole.name} from ${member.user.tag}`)),
      flatMap((liveRole) => member.removeRole(liveRole)),
    );
  }

  setLiveRole(guild, role) {
    return this.chaos.setGuildData(guild.id, DATAKEYS.LIVE_ROLE, role ? role.id : null).pipe(
      flatMap(() => this.getLiveRole(guild)),
    );
  }

  getLiveRole(guild) {
    return this.chaos.getGuildData(guild.id, DATAKEYS.LIVE_ROLE).pipe(
      map((roleId) => guild.roles.get(roleId)),
    );
  }

  removeLiveRole(guild) {
    return this.getLiveRole(guild).pipe(
      flatMap((oldRole) => this.setLiveRole(guild, null).pipe(
        map(() => oldRole),
      )),
    );
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
    return this.chaos.setGuildData(guild.id, DATAKEYS.STREAMER_ROLE, role ? role.id : null).pipe(
      flatMap(() => this.getStreamerRole(guild)),
    );
  }

  getStreamerRole(guild) {
    return this.chaos.getGuildData(guild.id, DATAKEYS.STREAMER_ROLE).pipe(
      map((roleId) => guild.roles.get(roleId)),
    );
  }

  removeStreamerRole(guild) {
    return this.getStreamerRole(guild).pipe(
      map((oldRole) => {
        if (oldRole) {
          return oldRole;
        } else {
          throw new RoleNotFoundError('No streamer role set.');
        }
      }),
      flatMap((oldRole) => this.setStreamerRole(guild, null).pipe(
        map(() => oldRole),
      )),
    );
  }
}

module.exports = StreamingService;
