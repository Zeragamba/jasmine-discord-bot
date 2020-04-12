const {DiscordAPIError} = require('discord.js');
const ChaosCore = require('chaos-core');

const {
  UnmappedRegionError,
  BrokenAliasError,
  RegionNotFoundError,
  AliasNotFoundError,
  RegionAlreadyAssigned,
} = require('../errors');

module.exports = {
  name: 'region',
  description: 'Sets the Overwatch region that you most often play on.',

  args: [
    {
      name: 'region',
      description: 'The Overwatch region you most often play in',
      required: true,
    },
  ],

  async run(context, response) {
    const regionService = this.chaos.getService('ow-info', 'regionService');

    try {
      let member = context.member;
      if (!member) {
        member = await context.guild.fetchMember(context.author);
      }

      const region = await regionService.setUserRegion(member, context.args.region);
      return response.send({
        content: `I've updated your region to ${region.name}`,
      });
    } catch (error) {
      switch (true) {
        case error instanceof ChaosCore.errors.ChaosError:
          return handleChaosError(error, context, response);
        case error instanceof DiscordAPIError:
          return handleDiscordApiError(error, context, response);
        default:
          throw  error;
      }
    }
  },
};

function handleChaosError(error, context, response) {
  switch (true) {
    case error instanceof RegionAlreadyAssigned:
      return response.send({
        content: `Looks like you already have the role for ${error.regionName}`,
      });
    case error instanceof UnmappedRegionError:
      return response.send({
        content:
          `I'm sorry, but '${error.regionName}' is not mapped to a valid role. ` +
          `Can you ask an Admin to update that?`,
      });
    case error instanceof BrokenAliasError:
      return response.send({
        content:
          `I'm sorry, but the alias '${error.aliasName}' is not mapped to a valid ` +
          `region. Can you ask an Admin to update that?`,
      });
    case error instanceof RegionNotFoundError:
    case error instanceof AliasNotFoundError:
      return response.send({
        content: `I'm sorry, but '${error.regionName}' is not an available region.`,
      });
    default:
      throw error;
  }
}

function handleDiscordApiError(error, context, response) {
  switch (error.message) {
    case "Missing Permissions":
      return response.send({
        content:
          `Whoops, I do not have permission to update user roles. Can you ask ` +
          `an admin to grant me the "Manage Roles" permission?`,
      });
    case "Privilege is too low...":
      return response.send({
        content: `I'm unable to change your roles; Your permissions outrank mine.`,
      });
    default:
      throw error;
  }
}
