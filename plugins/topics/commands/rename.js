const {of} = require('rxjs');
const {flatMap, catchError} = require('rxjs/operators');

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

  onListen() {
    this.topicService = this.chaos.getService('topics', 'topicService');
  },

  run(context, response) {
    let topicChannel = context.channel;
    let guild = context.guild;
    let channelName = this.topicService.channelNameSafeString(context.args.channelName);

    context.chaos.logger.debug(`renaming channel: ${topicChannel.name} => ${channelName}`);

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

    if (!topicChannel.parent || (topicChannel.parent.id !== openCategory.id && topicChannel.parent.id !== closedCategory.id)) {
      response.content =
        `My apologies, I can not rename ${topicChannel.toString()} as it is not in the open or closed topics categories.`;
      return response.send();
    }

    return of('').pipe(
      flatMap(() => topicChannel.setName(channelName)),
      flatMap((topicChannel) => topicChannel.send('===== Renamed =====').then(() => topicChannel)),
      catchError((error) => {
        response.type = 'message';

        if (error.name === 'DiscordAPIError') {
          if (error.message === "Missing Permissions") {
            response.content = `I'm sorry, but I do not have permission to rename channels. I need the "Manage Channels" permission.`;
          } else {
            response.content = `I'm sorry, Discord returned an unexpected error when I tried to rename the channel.`;
            context.chaos.handleError(error, [
              {name: "command", value: "rename"},
              {name: "guild", value: context.guild.name},
              {name: "channel", value: context.channel.name},
              {name: "args", value: JSON.stringify(context.args)},
              {name: "flags", value: JSON.stringify(context.flags)},
            ]);
          }
        } else {
          response.content = `I'm sorry, I ran into an unexpected problem.`;
          context.chaos.handleError(error, [
            {name: "command", value: "rename"},
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
