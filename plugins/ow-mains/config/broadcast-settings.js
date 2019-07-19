const {from} = require('rxjs');
const {flatMap, map, toArray, defaultIfEmpty} = require('rxjs/operators');
const Discord = require('discord.js');

module.exports = {
  name: 'broadcastSettings',
  description: `Views current broadcast settings`,

  run(context) {
    const broadcastService = this.chaos.getService('owMains', 'BroadcastService');
    let guild = context.guild;

    return from(broadcastService.broadcastTypes).pipe(
      flatMap((type) => {
        return broadcastService.getBroadcastChannel(type, guild).pipe(
          map((channel) => channel.toString()),
          map((channel) => [type, channel]),
          defaultIfEmpty([type, "*none*"]),
        );
      }),
      map(([type, channel]) => {
        return {name: type, value: channel};
      }),
      toArray(),
      map((fields) => new Discord.RichEmbed({fields})),
      map((embed) => {
        return {
          status: 200,
          content: "Here are the current broadcast settings:",
          embed,
        };
      }),
    );
  },
};
