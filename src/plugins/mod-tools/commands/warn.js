const Discord = require('discord.js');
const {ChaosError} = require('chaos-core').errors;

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

  async run(context, response) {
    let modLogService = this.chaos.getService('modTools', 'ModLogService');
    let userService = this.chaos.getService('core', 'UserService');

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

    try {
      const user = await userService.findUser(userString);

      await user.send({
        content: 'You have been issued a warning.',
        embed: warningEmbed,
      });
      await modLogService.addWarnEntry(guild, user, reason, context.author);

      return response.send({
        content: `${user.tag} has been warned`,
      });
    } catch (error) {
      if (error instanceof ChaosError) {
        return response.send({
          content: error.message,
        });
      } else if (error.message === "Cannot send messages to this user") {
        return response.send({
          content: `Sorry, I'm not able to direct message that user.`,
        });
      } else {
        throw error;
      }
    }
  },
};
