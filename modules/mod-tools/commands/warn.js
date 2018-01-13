const Rx = require('rx');
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
    let modLogService = context.nix.getService('modTools', 'ModLogService');
    let userService = context.nix.getService('core', 'UserService');

    let guild = context.guild;
    let userString = context.args.user;
    let reason = context.args.reason;

    return userService
      .findUser(userString)
      .map((member) => {
        if (!member) { throw new Error(ERRORS.USER_NOT_FOUND); }
        return member;
      })
      .flatMap((user) => {
        let warningEmbed = new Discord.RichEmbed();
        warningEmbed
          .setThumbnail(guild.iconURL())
          .setColor(Discord.Constants.Colors.DARK_GOLD)
          .setTitle('WARNING')
          .setDescription(reason || '')
          .addField('From Server', guild.name)
          .setTimestamp();

        return Rx.Observable
          .fromPromise(user.send({
            content: 'You have been issued a warning.',
            embed: warningEmbed,
          }))
          .map(() => user);
      })
      .flatMap((user) => {
        let modLogEmbed = new Discord.RichEmbed();
        modLogEmbed
          .setAuthor(`${user.tag} warned`, user.avatarURL())
          .setColor(Discord.Constants.Colors.DARK_GOLD)
          .setDescription(`User ID: ${user.id}`)
          .addField('Warned By', context.member)
          .addField('Reason', reason || '`none given`')
          .setTimestamp();

        return modLogService.addAuditEntry(guild, modLogEmbed).map(user);
      })
      .flatMap((user) => {
        response.content = `${user.tag} has been warned`;
        return response.send();
      })
      .catch((error) => {
        if (error.name === 'DiscordAPIError') {
          switch (error.message) {
            case "Cannot send messages to this user":
              response.content =`Sorry, I'm not able to direct message that user.`;
              break;
            default:
              response.content = `Err... Discord returned an unexpected error when I tried to ban that user.`;
              context.nix.messageOwner(
                "I got this error when I tried to ban a user:",
                {embed: context.nix.createErrorEmbed(context, error)}
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
            return Rx.Observable.throw(error);
        }
      });
  },
};
