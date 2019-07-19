const {of, throwError} = require('rxjs');
const {flatMap, map, catchError, mapTo} = require('rxjs/operators');
const Discord = require('discord.js');

const {ERRORS} = require('../utility');

module.exports = {
  name: 'warn',
  description: 'Issue a warning to a user',
  permissions: ['admin', 'mod'],

  args: [
    {
      name: 'user',
      description: 'The user to warn. Valid formats: User mention, userId, or user tag (case sensitive)',
      required: true,
    },
    {
      name: 'reason',
      description: 'The reason for the warning',
      required: false,
      greedy: true,
    },
  ],

  run(context, response) {
    let modLogService = context.chaos.getService('modTools', 'ModLogService');
    let userService = context.chaos.getService('core', 'UserService');

    let guild = context.guild;
    let userString = context.args.user;
    let reason = context.args.reason;

    let warningEmbed = new Discord.RichEmbed();
    warningEmbed
      .setThumbnail(guild.iconURL)
      .setColor(Discord.Constants.Colors.DARK_GOLD)
      .setTitle('WARNING')
      .addField('Server', guild.name);

    if (reason) {
      warningEmbed.setDescription(reason);
    }

    return userService.findUser(userString).pipe(
      map((member) => {
        if (!member) { throw new Error(ERRORS.USER_NOT_FOUND); }
        return member;
      }),
      flatMap((user) => of('').pipe(
        flatMap(() => user.send({
          content: 'You have been issued a warning.',
          embed: warningEmbed,
        })),
        map(user),
      )),
      flatMap((user) => modLogService.addWarnEntry(guild, user, reason, context.author).pipe(
        mapTo(user),
      )),
      flatMap((user) => {
        response.content = `${user.tag} has been warned`;
        return response.send();
      }),
      catchError((error) => {
        if (error.name === 'DiscordAPIError') {
          switch (error.message) {
            case "Cannot send messages to this user":
              response.content = `Sorry, I'm not able to direct message that user.`;
              break;
            default:
              response.content = `Err... Discord returned an unexpected error when I tried to ban that user.`;
              context.chaos.messageOwner(
                "I got this error when I tried to ban a user:",
                {
                  embed: context.chaos.createEmbedForError(error, [
                    {name: "guild", inline: true, value: context.guild.name},
                    {name: "channel", inline: true, value: context.channel.name},
                    {name: "command", inline: true, value: "ban"},
                    {name: "user to ban", inline: true, value: userString},
                    {name: "user banning", inline: true, value: context.author.tag},
                  ]),
                },
              );
          }

          return response.send();
        }

        switch (error.message) {
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
