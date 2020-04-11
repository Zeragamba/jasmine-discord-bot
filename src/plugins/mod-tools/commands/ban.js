const {throwError, from} = require('rxjs');
const {map, flatMap, mapTo, catchError} = require('rxjs/operators');
const {DiscordAPIError} = require('discord.js');
const ChaosCore = require('chaos-core');
const {ChaosError} = require('chaos-core').errors;

const {ERRORS} = require('../utility');

class BanCommand extends ChaosCore.Command {
  name = 'ban';
  description = 'Ban a user from the server';
  permissions = ['mod'];

  flags = [
    {
      name: 'days',
      shortAlias: 'd',
      description: 'Number of days of messages to delete',
      default: 2,
      type: 'int',
    },
  ];

  args = [
    {
      name: 'user',
      description: 'The user to ban. Valid formats: User mention, User ID, or User Tag (case sensitive)',
      required: true,
    },
    {
      name: 'reason',
      description: 'The reason for the ban',
      required: false,
      greedy: true,
    },
  ];

  run(context, response) {
    let userService = this.chaos.getService('core', 'UserService');

    let guild = context.guild;
    let userString = context.args.user;
    let reason = context.args.reason;
    let days = context.flags.days;

    return userService.findUser(userString).pipe(
      map((user) => {
        if (!user) {
          throw new Error(ERRORS.USER_NOT_FOUND);
        }
        return user;
      }),
      flatMap((user) => from(guild.fetchBans()).pipe(
        map((bans) => {
          if (bans.get(user.id)) {
            throw new ChaosError(`${user.tag} is already banned.`);
          }
          return user;
        }),
      )),
      flatMap((user) => {
        return from(guild.ban(user, {
          reason: `${reason || '`none given`'} | Banned by ${context.author.tag}`,
          days,
        })).pipe(
          mapTo(user),
        );
      }),
      flatMap((user) => response.send({content: `${user.tag} has been banned`})),
      catchError((error) => {
        if (error instanceof DiscordAPIError) {
          switch (error.message) {
            case 'Missing Permissions':
              return response.send({
                content:
                  `Whoops, I do not have permission to ban users. Can you ` +
                  `check if I have the "Ban members" permission?`,
              });
            case 'Privilege is too low...':
              return response.send({
                content:
                  `I'm sorry, but I don't have permission to ban that user. ` +
                  `They have higher permissions then me.`,
              });
            default:
              return throwError(error);
          }
        } else if (error instanceof ChaosError) {
          return response.send({
            content: error.message,
          });
        } else {
          return throwError(error);
        }
      }),
    );
  }
}

module.exports = BanCommand;
