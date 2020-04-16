const Service = require('chaos-core').Service;

const DATAKEYS = require('../lib/datakeys');
const {RoleNotFoundError} = require('../lib/errors');

function logPrefix(member) {
  return `[Streaming:${member.guild.name}:${member.user.tag}]`;
}

class StreamingService extends Service {
  constructor(chaos) {
    super(chaos);

    this.chaos.on("chaos.startup", () => {
      this.pluginService = this.chaos.getService('core', 'PluginService');
    });

    this.chaos.on("presenceUpdate", async ([oldMember, newMember]) => {
      await this.handlePresenceUpdate(oldMember, newMember);
    });
  }

  async handlePresenceUpdate(oldMember, newMember) {
    this.chaos.logger.debug(`${logPrefix(newMember)} Handling presence update for ${newMember.user.tag} in ${newMember.guild.name}`);

    const [
      pluginEnabled,
      liveRole,
      isStreamer,
    ] = await Promise.all([
      this.pluginService.isPluginEnabled(newMember.guild.id, 'streaming').toPromise(),
      this.getLiveRole(newMember.guild),
      this.memberIsStreamer(newMember),
    ]);

    this.chaos.logger.debug(`${logPrefix(newMember)} Plugin is ${pluginEnabled ? "enabled" : "disabled"} in ${newMember.guild.name}`);
    this.chaos.logger.debug(`${logPrefix(newMember)} Live role in ${newMember.guild.name} is ${liveRole ? liveRole.name : "<none>"}`);
    this.chaos.logger.debug(`${logPrefix(newMember)} ${newMember.user.tag} ${isStreamer ? "is" : "is not"} a streamer.`);

    if (!pluginEnabled || !liveRole || !isStreamer) {
      return;
    }

    try {
      await this.updateMemberRoles(newMember);
    } catch (error) {
      switch (error.message) {
        case "Adding the role timed out.":
        case "Removing the role timed out.":
          this.chaos.logger.debug(`${logPrefix(newMember)} Ignored timeout error: ${error.toString()}`);
          return;
        case "Missing Permissions":
          this.chaos.logger.debug(`${logPrefix(newMember)} Missing permissions to add/remove roles`);
          return;
        default:
          throw error;
      }
    }
  }

  async memberIsStreamer(member) {
    const streamerRole = await this.getStreamerRole(member.guild);
    if (streamerRole) {
      return member.roles.has(streamerRole.id);
    } else {
      // No stream role, thus all users are streamers.
      return true;
    }
  }

  async updateMemberRoles(member) {
    try {
      this.chaos.logger.debug(`${logPrefix(member)} Will update roles for ${member.user.tag}`);
      const isStreaming = this.memberIsStreaming(member);

      this.chaos.logger.debug(`${logPrefix(member)} ${member.user.tag} ${isStreaming ? "is" : "is not"} Streaming`);
      if (isStreaming) {
        await this.addLiveRoleToMember(member);
      } else {
        await this.removeLiveRoleFromMember(member);
      }
    } catch (error) {
      switch (error.message) {
        case "Adding the role timed out.":
        case "Removing the role timed out.":
          return;
        default:
          throw error;
      }
    }
  }

  async addLiveRoleToMember(member) {
    const liveRole = await this.getLiveRole(member.guild);
    if (liveRole && !member.roles.has(liveRole.id)) {
      this.chaos.logger.debug(`${logPrefix(member)} Adding role ${liveRole.name} to ${member.user.tag}`);
      await member.addRole(liveRole);
    }
  }

  async removeLiveRoleFromMember(member) {
    const liveRole = await this.getLiveRole(member.guild);
    if (liveRole && member.roles.has(liveRole.id)) {
      this.chaos.logger.debug(`${logPrefix(member)} Removing role ${liveRole.name} from ${member.user.tag}`);
      await member.removeRole(liveRole);
    }
  }

  async setLiveRole(guild, role) {
    await this.setGuildData(guild.id, DATAKEYS.LIVE_ROLE, role ? role.id : null);
    return this.getLiveRole(guild);
  }

  async getLiveRole(guild) {
    const roleId = await this.getGuildData(guild.id, DATAKEYS.LIVE_ROLE);
    return guild.roles.get(roleId);
  }

  async removeLiveRole(guild) {
    const oldRole = await this.getLiveRole(guild);
    await this.setLiveRole(guild, null);
    return oldRole;
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

  async setStreamerRole(guild, role) {
    await this.setGuildData(guild.id, DATAKEYS.STREAMER_ROLE, role ? role.id : null);
    return this.getStreamerRole(guild);
  }

  async getStreamerRole(guild) {
    const roleId = await this.getGuildData(guild.id, DATAKEYS.STREAMER_ROLE);
    return guild.roles.get(roleId);
  }

  async removeStreamerRole(guild) {
    const oldRole = await this.getStreamerRole(guild);
    if (!oldRole) {
      throw new RoleNotFoundError('No streamer role set.');
    }
    await this.setStreamerRole(guild, null);
    return oldRole;
  }
}

module.exports = StreamingService;
