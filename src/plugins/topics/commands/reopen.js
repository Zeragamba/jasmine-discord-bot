module.exports = {
  name: 'reopen',
  description: 'reopen the current topic, or specify a topic to reopen.',
  scope: 'text',

  args: [
    {
      name: 'channelName',
      description: 'The name of the channel to reopen',
      required: false,
      greedy: true,
    },
  ],

  async run(context, response) {
    const topicService = this.chaos.getService('topics', 'topicService');
    const guild = context.guild;
    const channelName = context.args.channelName;

    let openCategory = topicService.getOpenTopicsCategory(guild);
    if (!openCategory) {
      response.type = 'message';
      response.content =
        "My apologies, I was not able to find the open topics category.";
      return response.send();
    }

    let closedCategory = topicService.getClosedTopicsCategory(guild);
    if (!closedCategory) {
      response.type = 'message';
      response.content =
        "My apologies, I was not able to find the closed topics category.";
      return response.send();
    }

    let topicChannel = null;
    if (channelName) {
      topicChannel = topicService.findChannel(guild, channelName);
    } else {
      topicChannel = context.channel;
    }

    if (!topicChannel) {
      response.type = 'message';
      response.content =
        "My apologies, I was not able to find that topic.";
      return response.send();
    }

    if (!topicChannel.parent || topicChannel.parent.id !== closedCategory.id) {
      response.type = 'message';
      response.content =
        `My apologies, I can not move ${topicChannel.toString()} as it is not in the closed topics category.`;
      return response.send();
    }

    try {
      await topicChannel.setParent(openCategory);
      await topicChannel.send('===== Reopened =====');

      if (topicChannel.id !== context.channel.id) {
        response.type = 'reply';
        response.content = `I have reopened the channel ${topicChannel.toString()}.`;
        return response.send();
      }
    } catch (error) {
      if (error.message === "Missing Permissions") {
        return response.send({
          content:
            `I'm sorry, but I do not have permission to move channels. I ` +
            `need the "Manage Channels" permission.`,
        });
      } else {
        throw error;
      }
    }
  },
};
