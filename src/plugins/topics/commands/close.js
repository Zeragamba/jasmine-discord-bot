const {of} = require('rxjs');
const {flatMap, catchError} = require('rxjs/operators');

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

  run(context, response) {
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

    return of('').pipe(
      flatMap(() => topicChannel.setParent(closedCategory)),
      flatMap((topicChannel) => topicChannel.send('===== Closed =====').then(() => topicChannel)),
      flatMap((topicChannel) => {
        if (topicChannel.id !== context.channel.id) {
          response.type = 'reply';
          response.content = `I have closed the channel ${topicChannel.toString()}.`;
          return response.send();
        }
        return of();
      }),
      catchError((error) => {
        response.type = 'message';

        if (error.name === 'DiscordAPIError') {
          if (error.message === "Missing Permissions") {
            response.content = `I'm sorry, but I do not have permission to move channels. I need the "Manage Channels" permission.`;
          } else {
            response.content = `I'm sorry, Discord returned an unexpected error when I tried to move the channel.`;
            this.chaos.handleError(error, [
              {name: "command", value: "close"},
              {name: "guild", value: context.guild.name},
              {name: "channel", value: context.channel.name},
              {name: "args", value: JSON.stringify(context.args)},
              {name: "flags", value: JSON.stringify(context.flags)},
            ]);
          }
        } else {
          response.content = `I'm sorry, I ran into an unexpected problem.`;
          this.chaos.handleError(error, [
            {name: "command", value: "close"},
            {name: "guild", value: context.guild.name},
            {name: "channel", value: context.channel.name},
            {name: "args", value: JSON.stringify(context.args)},
            {name: "flags", value: JSON.stringify(context.flags)},
          ]);
        }

        return response.send();
      }),
    );
  },
};
