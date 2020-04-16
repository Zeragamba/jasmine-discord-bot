const Discord = require('discord.js');

module.exports = {
  name: 'viewSettings',
  description: `View the current settings for the streaming module`,

  async run(context) {
    const streamingService = this.chaos.getService('streaming', 'streamingService');

    const [liveRole, streamerRole] = await Promise.all([
      streamingService.getLiveRole(context.guild),
      streamingService.getStreamerRole(context.guild),
    ]);

    let embed = new Discord.RichEmbed();
    embed.addField("Live Role:", liveRole ? liveRole.name : "[Not set]");
    embed.addField("Streamer Role:", streamerRole ? streamerRole.name : "[Not set]");

    return {
      status: 200,
      content: `Here are the current settings for the streaming plugin:`,
      embed,
    };
  },
};
