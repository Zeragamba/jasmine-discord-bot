const DataKeys = require('../datakeys');

module.exports = {
  name: 'unsubBroadcast',
  description: `Unsubscribe from a type of broadcast.`,

  args: [
    {
      name: 'type',
      required: true,
    },
  ],

  run(context) {
    const broadcastService = this.chaos.getService('owMains', 'BroadcastService');
    const guild = context.guild;
    const broadcastType = context.args.type;

    if (!broadcastService.isValidType(broadcastType)) {
      return {
        content: `${broadcastType} is not a valid broadcast type. Valid types: ${broadcastService.broadcastTypes.join(', ')}`,
      };
    }

    this.setGuildData(guild.id, DataKeys.broadcastChannelId(broadcastType), null);
    return {
      status: 200,
      content: `I have disabled ${broadcastType} broadcasts`,
    };
  },
};
