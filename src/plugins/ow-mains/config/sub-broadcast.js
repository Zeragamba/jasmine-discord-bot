const DataKeys = require('../datakeys');

module.exports = {
  name: 'subBroadcast',
  description: `Subscribe to a type of broadcast in a channel.`,

  args: [
    {
      name: 'type',
      required: true,
    },
    {
      name: 'channel',
      required: true,
    },
  ],

  async run(context) {
    const broadcastService = this.chaos.getService('owMains', 'BroadcastService');
    const guild = context.guild;
    const broadcastType = context.args.type;
    const channelString = context.args.channel;

    if (!broadcastService.isValidType(broadcastType)) {
      return {
        content: `${broadcastType} is not a valid broadcast type. Valid types: ${broadcastService.broadcastTypes.join(', ')}`,
      };
    }

    let channel = guild.channels.find((c) => c.toString() === channelString || c.id.toString() === channelString);
    if (!channel) {
      return {
        content: "I was not able to find that channel",
      };
    }

    try {
      await this.setGuildData(guild.id, DataKeys.broadcastChannelId(broadcastType), channel.id);
      await channel.send(`I will send ${broadcastType} broadcasts here.`);

      return {
        content: `I have enabled ${broadcastType} broadcasts in the channel ${channel}`,
      };
    } catch (error) {
      if (error.message === "Missing Permissions") {
        return {
          status: 400,
          content: `Whoops, I do not have permission to talk in that channel.`,
        };
      } else {
        throw error;
      }
    }
  },
};
