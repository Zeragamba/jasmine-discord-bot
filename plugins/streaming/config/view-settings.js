const Rx = require('rx');
const Discord = require('discord.js');

module.exports = {
  name: 'viewSettings',
  description: `View the current settings for the streaming module`,

  configureAction() {
    this.streamingService = this.chaos.getService('streaming', 'streamingService');
  },

  run(context) {
    let guild = context.guild;

    return Rx.Observable
      .zip(
        this.streamingService.getLiveRole(guild),
        this.streamingService.getStreamerRole(guild),
      )
      .map(([liveRole, streamerRole]) => {
        let embed = new Discord.RichEmbed();

        embed.addField("Live Role:", liveRole ? liveRole.name : "[Not set]");
        embed.addField("Streamer Role:", streamerRole ? streamerRole.name : "[Not set]");

        return {
          status: 200,
          content: `Here are the current settings for the streaming module:`,
          embed,
        };
      });
  },
};
