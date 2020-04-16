const ChaosCore = require('chaos-core');
const {ChaosError} = require('chaos-core').errors;

class BanCommand extends ChaosCore.Command {
  name = 'ban';
  description = 'Ban a user from the server';
  permissions = ['admin', 'mod'];

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

  async run(context, response) {
    let userService = this.chaos.getService('core', 'UserService');

    let guild = context.guild;
    let userString = context.args.user;
    let reason = context.args.reason;
    let days = context.flags.days;

    try {
      const user = await userService.findUser(userString);
      const bans = await guild.fetchBans();
      if (bans.get(user.id)) {
        return response.send({
          content: `${user.tag} is already banned.`,
        });
      }

      await guild.ban(user, {
        reason: `${reason || '`none given`'} | Banned by ${context.author.tag}`,
        days,
      });

      return response.send({
        content: `${user.tag} has been banned`,
      });
    } catch (error) {
      if (error instanceof ChaosError) {
        return response.send({
          content: error.message,
        });
      } else if (error.message === 'Missing Permissions') {
        return response.send({
          content:
            `Whoops, I do not have permission to ban users. Can you ` +
            `check if I have the "Ban members" permission?`,
        });
      } else if (error.message === 'Privilege is too low...') {
        return response.send({
          content:
            `I'm sorry, but I don't have permission to ban that user. ` +
            `They have higher permissions then me.`,
        });
      } else {
        throw error;
      }
    }
  }
}

module.exports = BanCommand;
