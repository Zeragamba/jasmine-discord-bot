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

    this.chaos.on("chaos.ready", async () => {
      const guilds = this.chaos.discord.guilds.array();
      await Promise.all(guilds.map(async (guild) => this.updateAllMembers(guild)));
    });

    this.chaos.on("presenceUpdate", async ([_, newMember]) => {
      await this.updateMemberRoles(newMember);
    });
  }

  async handlePresenceUpdate(oldMember, newMember) {
    this.chaos.logger.debug(`${logPrefix(newMember)} Handling presence update for ${newMember.user.tag} in ${newMember.guild.name}`);
    await this.updateMemberRoles(newMember);
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

  async updateAllMembers(guild) {
    const allMembers = guild.members.array();
    await Promise.all(allMembers.map(async (member) => {
      await this.updateMemberRoles(member);
    }));
  }

  async updateMemberRoles(member) {
    try {
      const [
        pluginEnabled,
        liveRole,
        isStreamer,
      ] = await Promise.all([
        this.pluginService.isPluginEnabled(member.guild.id, 'streaming'),
        this.getLiveRole(member.guild),
        this.memberIsStreamer(member),
      ]);

      this.chaos.logger.debug(`${logPrefix(member)} Plugin is ${pluginEnabled ? "enabled" : "disabled"} in ${member.guild.name}`);
      this.chaos.logger.debug(`${logPrefix(member)} Live role in ${member.guild.name} is ${liveRole ? liveRole.name : "<none>"}`);
      this.chaos.logger.debug(`${logPrefix(member)} ${member.user.tag} ${isStreamer ? "is" : "is not"} a streamer.`);

      if (!pluginEnabled || !liveRole || !isStreamer) {
        return;
      }

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
          this.chaos.logger.debug(`${logPrefix(member)} Ignored timeout error: ${error.toString()}`);
          return;
        case "Missing Permissions":
          this.chaos.logger.debug(`${logPrefix(member)} Missing permissions to add/remove roles`);
          return;
        default:
          throw error;
      }
    }
  }

  async addLiveRoleToMember(member) {
    const liveRole = await this.getLiveRole(member.guild);
    if (liveRole && !member.roles.has(liveRole.id)) {
      this.chaos.logger.info(`${logPrefix(member)} ${member.user.tag} started streaming. Adding role ${liveRole.name}.`);
      await member.addRole(liveRole);
    }
  }

  async removeLiveRoleFromMember(member) {
    const liveRole = await this.getLiveRole(member.guild);
    if (liveRole && member.roles.has(liveRole.id)) {
      this.chaos.logger.info(`${logPrefix(member)} ${member.user.tag} stopped streaming. Removing role ${liveRole.name}.`);
      await member.removeRole(liveRole);
    }
  }

  async setLiveRole(guild, role) {
    await this.setGuildData(guild.id, DATAKEYS.LIVE_ROLE, role ? role.id : null);
    let liveRole = await this.getLiveRole(guild);
    await this.updateAllMembers(guild);
    return liveRole;
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
    return member.presence.activities.some((game) => game.streaming);
  }

  async setStreamerRole(guild, role) {
    await this.setGuildData(guild.id, DATAKEYS.STREAMER_ROLE, role ? role.id : null);
    let streamerRole = this.getStreamerRole(guild);
    await this.updateAllMembers(guild);
    return streamerRole;
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
