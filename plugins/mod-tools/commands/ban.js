const {throwError, from} = require('rxjs');
const {map, flatMap, mapTo, catchError} = require('rxjs/operators');

const {ERRORS} = require('../utility');

module.exports = {
  name: 'ban',
  description: 'Ban a user from the server',
  permissions: ['admin', 'mod'],

  flags: [
    {
      name: 'days',
      shortAlias: 'd',
      description: 'Number of days of messages to delete',
      default: 2,
      type: 'int',
    },
  ],

  args: [
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
  ],

  run(context, response) {
    let userService = context.chaos.getService('core', 'UserService');

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
            throw new Error(ERRORS.USER_ALREADY_BANNED);
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
        if (error.name === 'DiscordAPIError') {
          switch (error.message) {
            case 'Missing Permissions':
              response.content =
                `Whoops, I do not have permission to ban users. Can you check if I have the ` +
                `"Ban members" permission?`;
              break;
            case 'Privilege is too low...':
              response.content =
                `I'm sorry, but I don't have permission to ban that user. They have higher permissions then me.`;
              break;
            default:
              response.content = `Err... Discord returned an unexpected error when I tried to ban that user.`;
              context.chaos.messageOwner(
                'I got this error when I tried to ban a user:',
                {embed: context.chaos.createEmbedForError(error)},
              );
          }

          return response.send();
        }

        switch (error.message) {
          case ERRORS.USER_ALREADY_BANNED:
            return response.send({
              content: `That user has already been banned`,
            });
          case ERRORS.USER_NOT_FOUND:
            return response.send({
              content:
                `Sorry, but I wasn't able to find that user. I can only find users by User Tag if they are in ` +
                `another guild I'm on. If you know their User ID I can find them by that.`,
            });
          default:
            return throwError(error);
        }
      }),
    );
  },
};
