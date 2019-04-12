const {
  DATAKEYS,
  BROADCAST_TYPES,
  BROADCAST_TOKENS,
} = require('../utility');

module.exports = {
  name: 'allowBroadcasting',
  description: `Enable broadcasting from this server.`,

  inputs: [
    {
      name: 'type',
      required: true,
    },
    {
      name: 'token',
      required: true,
    },
  ],

  run(context) {
    let guild = context.guild;
    let typeString = context.inputs.type;
    let token = context.inputs.token;

    let broadcastType = Object.keys(BROADCAST_TYPES).find((t) => t.toLowerCase() === typeString.toLowerCase());
    if (!broadcastType) {
      return {
        status: 200,
        content: `${typeString} is not a valid broadcast type. Valid types: ${Object.keys(BROADCAST_TYPES).join(', ')}`,
      };
    }

    if (token !== BROADCAST_TOKENS[broadcastType]) {
      return {
        status: 200,
        content: `I'm sorry, but that token is not valid for ${broadcastType} broadcasts`,
      };
    }

    return this.chaos.getGuildData(guild.id, DATAKEYS.BROADCAST_TOKENS)
      .do((savedData) => savedData[broadcastType] = token)
      .flatMap((savedData) => this.chaos.setGuildData(guild.id, DATAKEYS.BROADCAST_TOKENS, savedData))
      .map(() => ({
        status: 200,
        content: `This server is now allowed to send ${broadcastType} broadcasts.`,
      }));
  },
};
