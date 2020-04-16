module.exports = {
  name: 'close',
  description: 'Close the current topic, or specify a topic to close.',
  scope: 'text',

  args: [
    {
      name: 'channelName',
      description: 'The name of the channel to close',
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
      response.content = `My apologies, I was not able to find the topic "${channelName}".`;
      return response.send();
    }

    if (!topicChannel.parent || topicChannel.parent.id !== openCategory.id) {
      response.type = 'message';
      response.content =
        `My apologies, I can not close ${topicChannel.toString()} as it is not in the open topics category.`;
      return response.send();
    }

    try {
      await topicChannel.setParent(closedCategory);
      await topicChannel.send('===== Closed =====');

      if (topicChannel.id !== context.channel.id) {
        response.type = 'reply';
        response.content = `I have closed the channel ${topicChannel.toString()}.`;
        return response.send();
      }
    } catch (error) {
      response.type = 'message';

      if (error.message === "Missing Permissions") {
        response.send({
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
