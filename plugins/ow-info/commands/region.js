const {throwError, zip} = require('rxjs');
const {flatMap, catchError} = require('rxjs/operators');
const {DiscordAPIError} = require('discord.js');

const {
  RegionError,
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

  run(context, response) {
    const regionService = this.chaos.getService('ow-info', 'regionService');
    const member = context.message.member;
    const regionName = context.args.region;

    return regionService.setUserRegion(member, regionName).pipe(
      flatMap((grantedRegion) =>
        response.send({
          type: 'reply',
          content: `I've updated your region to ${grantedRegion}`,
        }),
      ),
      catchError((error) => {
        if (error instanceof RegionError) {
          return handleRegionError(error, context, response);
        }

        if (error instanceof DiscordAPIError) {
          return handleDiscordApiError(error, context, response);
        }

        return throwError(error);
      }),
    );
  },
};

function handleRegionError(error, context, response) {
  if (error instanceof RegionAlreadyAssigned) {
    return response.send({content: `Looks like you already have the role for ${error.regionName}`});
  }

  if (error instanceof UnmappedRegionError) {
    return response.send({
      content:
        `I'm sorry, but '${error.regionName}' is not mapped to a valid role. Can you ask an Admin to update that?`,
    });
  }

  if (error instanceof BrokenAliasError) {
    return response.send({
      content:
        `I'm sorry, but the alias '${error.aliasName}' is not mapped to a valid region. Can you ask an Admin to ` +
        `update that?`,
    });
  }

  if (error instanceof RegionNotFoundError || error instanceof AliasNotFoundError) {
    return response.send({content: `I'm sorry, but '${error.regionName}' is not an available region.`});
  }
}

function handleDiscordApiError(error, context, response) {
  if (error.message === "Missing Permissions") {
    return response.send({
      type: 'message',
      content:
        `Whoops, I do not have permission to update user roles. Can you ask an admin to grant me the ` +
        `"Manage Roles" permission?`,
    });
  }

  if (error.message === "Privilege is too low...") {
    return response.send({
      type: 'message',
      content: `I'm unable to change your roles; Your permissions outrank mine.`,
    });
  }

  return zip(
    response.send({
      type: 'message',
      content: `Err... Discord returned an unexpected error when I tried to update your roles.`,
    }),
    context.chaos.messageOwner(
      `I got this error when I tried to update ${context.author.tag}'s platform:`,
      {
        embed: context.chaos.createEmbedForError(error, [
          {name: "guild", value: context.guild.name},
          {name: "channel", value: context.channel.name},
          {name: "command", value: "region"},
          {name: "user", value: context.author.tag},
        ]),
      },
    ),
  );
}
