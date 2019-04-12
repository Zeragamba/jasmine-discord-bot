const Rx = require('rx');

module.exports = {
  name: 'topic',
  description: 'Open a new discussion channel',
  scope: 'text',

  args: [
    {
      name: 'channelName',
      description: 'The name of the channel to open',
      required: true,
      greedy: true,
    },
  ],

  configureCommand() {
    this.topicService = this.chaos.getService('topics', 'topicService');
  },

  run(context, response) {
    let guild = context.guild;
    let channelName = this.topicService.channelNameSafeString(context.args.channelName);

    context.chaos.logger.debug(`attempting to open topic channel: ${channelName}`);

    let openCategory = this.topicService.getOpenTopicsCategory(guild);
    if (!openCategory) {
      response.type = 'message';
      response.content =
        "My apologies, I was not able to find the open topics category.";
      return response.send();
    }

    return Rx.Observable
      .fromPromise(context.guild.createChannel(channelName))
      .flatMap((channel) => channel.setParent(openCategory).then(() => channel))
      .do((channel) => this.topicService.watchChannel(channel))
      .flatMap((channel) => {
        response.type = 'reply';
        response.content = 'I have opened the channel ' + channel.toString() + '.';
        return response.send();
      })
      .catch((error) => {
        response.type = 'message';

        if (error.name === 'DiscordAPIError') {
          if (error.message === "Missing Permissions") {
            response.content = `I'm sorry, but I do not have permission to create channels. I need the "Manage Channels" permission.`;
          }
          else if (error.message.includes("Invalid Form Body")) {
            response.content = `I'm sorry, Discord does not allow that channel name.`;
          }
          else {
            response.content = `I'm sorry, Discord returned an unexpected error when I tried to create the channel.`;
            context.chaos.handleError(error, [
              {name: "command", value: "topic"},
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
            {name: "command", value: "topic"},
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
