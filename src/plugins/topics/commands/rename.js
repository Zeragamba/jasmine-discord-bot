module.exports = {
  name: 'rename',
  description: 'rename the current topic',
  scope: 'text',

  args: [
    {
      name: 'channelName',
      description: 'The new name of the channel to close',
      required: true,
      greedy: true,
    },
  ],

  async run(context, response) {
    const topicService = this.chaos.getService('topics', 'topicService');
    const guild = context.guild;
    const channelName = topicService.channelNameSafeString(context.args.channelName);

    this.chaos.logger.debug(`renaming channel: ${topicChannel.name} => ${channelName}`);

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

    let topicChannel = context.channel;
    if (!topicChannel.parent || (topicChannel.parent.id !== openCategory.id && topicChannel.parent.id !== closedCategory.id)) {
      response.content =
        `My apologies, I can not rename ${topicChannel.toString()} as it is not in the open or closed topics categories.`;
      return response.send();
    }

    try {
      await topicChannel.setName(channelName);
      await topicChannel.send('===== Renamed =====');
    } catch (error) {
      response.type = 'message';

      if (error.message === "Missing Permissions") {
        return response.send({
          content:
            `I'm sorry, but I do not have permission to rename channels. I ` +
            `need the "Manage Channels" permission.`,
        });
      } else {
        throw error;
      }
    }
  },
};
