const DataKeys = require('../datakeys');

module.exports = {
  name: 'enableNetModLog',
  description: `Enable network mod log reporting to this server.`,

  args: [
    {
      name: 'channel',
      required: true,
    },
  ],

  async run(context) {
    const owmnService = this.chaos.getService('owMains', 'OwmnService');
    const guild = context.guild;
    const channelString = context.args.channel;

    if (!owmnService.isOwmnGuild(guild)) {
      return {
        content: "NetModLog can only be enabled on the OWMN server.",
      };
    }

    let channel = guild.channels.find((c) => c.toString() === channelString || c.id.toString() === channelString);
    if (!channel) {
      return {
        content: "I was not able to find that channel",
      };
    }

    try {
      await this.setGuildData(guild.id, DataKeys.netModLogChannelId, channel.id);
      await channel.send('I will post the network moderation log here now.');

      return {
        status: 200,
        content: `This server will now receive the network moderation log.`,
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
