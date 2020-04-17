const {ChaosError} = require('chaos-core').errors;

module.exports = {
  name: 'unban',
  description: 'unban a user from the server',
  permissions: ['admin', 'mod'],

  args: [
    {
      name: 'user',
      description: 'The user to unban. Valid formats: User mention, userId, or user tag (case sensitive)',
      required: true,
    },
  ],

  async run(context, response) {
    let userService = this.chaos.getService('core', 'UserService');

    let guild = context.guild;
    let userString = context.args.user;

    try {
      const user = await userService.findUser(userString);
      const bans = await guild.fetchBans();
      if (!bans.get(user.id)) {
        return response.send({
          content: `${user.tag} is not banned.`,
        });
      }

      await guild.unban(user, `Unbanned by ${context.author.tag}`);
      return response.send({
        content: `${user.tag} has been unbanned.`,
      });
    } catch (error) {
      if (error instanceof ChaosError) {
        return response.send({
          content: error.message,
        });
      } else if (error.message === "Unknown Ban") {
        return response.send({
          content: `Looks like that user was not banned.`,
        });
      } else if (error.message === 'Missing Permissions') {
        return response.send({
          content:
            `Whoops, I do not have permission to ban unban. Can you ` +
            `check if I have the "Ban members" permission?`,
        });
      } else if (error.message === 'Privilege is too low...') {
        return response.send({
          content:
            `I'm sorry, but I don't have permission to unban that user. ` +
            `They were banned by someone with higher permissions then me.`,
        });
      } else {
        throw error;
      }
    }
  },
};
