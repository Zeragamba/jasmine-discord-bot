const {Command} = require('chaos-core');

class TopicCommand extends Command {
  name = 'topic';
  description = 'Open a new discussion channel';

  args = [
    {
      name: 'channelName',
      description: 'The name of the channel to open',
      required: true,
      greedy: true,
    },
  ];

  async run(context, response) {
    const topicService = this.chaos.getService('topics', 'topicService');
    const guild = context.guild;
    const channelName = topicService.channelNameSafeString(context.args.channelName);

    this.logger.debug(`attempting to open topic channel: ${channelName}`);

    let openCategory = topicService.getOpenTopicsCategory(guild);
    if (!openCategory) {
      response.type = 'message';
      response.content =
        "My apologies, I was not able to find the open topics category.";
      return response.send();
    }

    if (guild.channels.some((c) => c.name === channelName)) {
      response.type = 'message';
      response.content = "A channel with that name already exists.";
      return response.send();
    }

    this.logger.debug(`Open Category found: ${openCategory}`);

    try {

      const channel = await context.guild.createChannel(channelName, {type: 'text'});
      this.logger.debug(`Channel created: ${channel}`);

      await channel.setParent(openCategory);
      this.logger.debug(`Channel parent set`);

      topicService.watchChannel(channel);

      return response.send({
        type: 'reply',
        content: `I have opened the channel ${channel}.`,
      });
    } catch (error) {
      if (error.message === "Missing Permissions") {
        return response.send({
          content:
            `I'm sorry, but I do not have permission to create channels. I ` +
            `need the "Manage Channels" permission.`,
        });
      } else if (error.message.includes("Invalid Form Body")) {
        return response.send({
          content:
            `I'm sorry, Discord does not allow that channel name.`,
        });
      } else {
        throw error;
      }
    }
  }
}

module.exports = TopicCommand;
