const Rx = require('rx');
const Discord = require('discord.js');

module.exports = {
  name: 'broadcastSettings',
  description: `Views current broadcast settings`,

  inputs: [],

  onListen() {
    this.broadcastService = this.chaos.getService('owMains', 'BroadcastService');
  },

  run(context) {
    let guild = context.guild;

    return Rx.Observable.from(this.broadcastService.broadcastTypes)
      .flatMap((type) => {
        return this.broadcastService.getBroadcastChannel(type, guild)
          .map((channel) => channel.toString())
          .map((channel) => [type, channel])
          .defaultIfEmpty([type, "*none*"]);
      })
      .map(([type, channel]) => {
          return { name: type, value: channel };
      })
      .toArray()
      .map((fields) => new Discord.RichEmbed({fields}))
      .map((embed) => {
        return {
          status: 200,
          content: "Here are the current broadcast settings:",
          embed,
        };
      });
  },
};
