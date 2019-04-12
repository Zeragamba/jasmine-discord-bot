const Rx = require('rx');

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

  configureCommand() {
    this.topicService = this.chaos.getService('topics', 'topicService');
  },

  run(context, response) {
    let topicChannel = null;
    let guild = context.guild;
    let channelName = context.args.channelName;

    let openCategory = this.topicService.getOpenTopicsCategory(guild);
    if (!openCategory) {
      response.type = 'message';
      response.content =
        "My apologies, I was not able to find the open topics category.";
      return response.send();
    }

    let closedCategory = this.topicService.getClosedTopicsCategory(guild);
    if (!closedCategory) {
      response.type = 'message';
      response.content =
        "My apologies, I was not able to find the closed topics category.";
      return response.send();
    }

    if (channelName) {
      topicChannel = this.topicService.findChannel(guild, channelName);
    }
    else {
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

    return Rx.Observable
      .fromPromise(topicChannel.setParent(openCategory))
      .flatMap((topicChannel) => topicChannel.send('===== Reopened =====').then(() => topicChannel))
      .flatMap((topicChannel) => {
        if (topicChannel.id !== context.channel.id) {
          response.type = 'reply';
          response.content = `I have reopened the channel ${topicChannel.toString()}.`;
          return response.send();
        }
        return Rx.Observable.return(topicChannel);
      })
      .catch((error) => {
        response.type = 'message';

        if (error.name === 'DiscordAPIError') {
          if (error.message === "Missing Permissions") {
            response.content = `I'm sorry, but I do not have permission to move channels. I need the "Manage Channels" permission.`;
          }
          else {
            response.content = `I'm sorry, Discord returned an unexpected error when I tried to move the channel.`;
            context.chaos.handleError(error, [
              {name: "command", value: "reopen"},
              {name: "guild", value: context.guild.name},
              {name: "channel", value: context.channel.name},
              {name: "args", value: JSON.stringify(context.args)},
              {name: "flags", value: JSON.stringify(context.flags)},
            ]);
          }
        }
        else {
          response.content = `I'm sorry, I ran into an unexpected problem.`;
          context.chaos.handleError(error, [
            {name: "command", value: "reopen"},
            {name: "guild", value: context.guild.name},
            {name: "channel", value: context.channel.name},
            {name: "args", value: JSON.stringify(context.args)},
            {name: "flags", value: JSON.stringify(context.flags)},
          ]);
        }

        return response.send();
      });
  },
};
