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

  run(context, response) {
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
            this.chaos.handleError(error, [
              {name: "command", value: "rename"},
              {name: "guild", value: context.guild.name},
              {name: "channel", value: context.channel.name},
              {name: "args", value: JSON.stringify(context.args)},
              {name: "flags", value: JSON.stringify(context.flags)},
            ]);
          }
        } else {
          response.content = `I'm sorry, I ran into an unexpected problem.`;
          this.chaos.handleError(error, [
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
