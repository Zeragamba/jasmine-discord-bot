const Discord = require('discord.js');

module.exports = {
  name: 'broadcastSettings',
  description: `Views current broadcast settings`,

  async run(context) {
    const broadcastService = this.chaos.getService('owMains', 'BroadcastService');
    let guild = context.guild;
    const embed = new Discord.RichEmbed();

    for (const type of broadcastService.broadcastTypes) {
      const channelName = await broadcastService.getBroadcastChannel(type, guild)
        .then((channel) => (channel ? channel.toString() : "*none*"));
      embed.addField(type, channelName);
    }

    return {
      status: 200,
      content: "Here are the current broadcast settings:",
      embed,
    };
  },
};
