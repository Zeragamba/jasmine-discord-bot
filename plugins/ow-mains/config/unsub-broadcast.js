const {BROADCAST_TYPES} = require('../utility');

module.exports = {
  name: 'unsubBroadcast',
  description: `Unsubscribe from a type of broadcast. Broadcast types are: ${Object.keys(BROADCAST_TYPES).join(', ')}`,

  inputs: [
    {
      name: 'type',
      required: true,
    },
  ],

  run(context) {
    let guild = context.guild;
    let typeString = context.inputs.type;

    let broadcastType = Object.keys(BROADCAST_TYPES).find((t) => t.toLowerCase() === typeString.toLowerCase());
    if (!broadcastType) {
      return {
        status: 400,
        content: `${typeString} is not a valid broadcast type. Valid types: ${Object.keys(BROADCAST_TYPES).join(', ')}`,
      };
    }

    let datakey = BROADCAST_TYPES[broadcastType];
    return this.chaos
      .setGuildData(guild.id, datakey, null)
      .map(() => ({
        status: 200,
        content: `I have disabled ${broadcastType} broadcasts`,
      }));
  },
};
