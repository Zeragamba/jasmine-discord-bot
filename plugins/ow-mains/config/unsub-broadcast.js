const Rx = require('rx');
const DataKeys = require('../datakeys');

module.exports = {
  name: 'unsubBroadcast',
  description: `Unsubscribe from a type of broadcast.`,

  inputs: [
    {
      name: 'type',
      required: true,
    },
  ],

  onListen() {
    this.broadcastService = this.chaos.getService('owMains', 'BroadcastService');
  },

  run(context) {
    let guild = context.guild;
    let broadcastType = context.inputs.type;

    if (!this.broadcastService.isValidType(broadcastType)) {
      return Rx.Observable.of({
        content: `${broadcastType} is not a valid broadcast type. Valid types: ${this.broadcastService.broadcastTypes.join(', ')}`,
      });
    }

    return this.chaos
      .setGuildData(guild.id, DataKeys.broadcastChannelId(broadcastType), null)
      .map(() => ({
        status: 200,
        content: `I have disabled ${broadcastType} broadcasts`,
      }));
  },
};
