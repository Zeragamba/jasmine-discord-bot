const Rx = require('rx');

const {
  BroadcastingNotAllowedError,
  BroadcastCanceledError,
} = require('../errors');
const {
  BROADCAST_TYPES,
} = require('../utility');

module.exports = {
  name: 'broadcast',
  description: 'broadcast a message to all connected servers',
  permissions: ['broadcaster'],

  args: [
    {
      name: 'type',
      description: `the type of broadcast message. Types: ${Object.keys(BROADCAST_TYPES).join(', ')}`,
      required: true,
    },
    {
      name: 'message',
      description: 'the message to broadcast. @ everyone and @ here are currently not allowed.',
      required: true,
      greedy: true,
    },
  ],

  configureCommand() {
    this.broadcastService = this.chaos.getService('owMains', 'broadcastService');
  },

  run(context, response) {
    let guild = context.guild;
    let broadcastType = context.args.type.toLowerCase();
    let broadcastBody = context.args.message + `\n*- ${context.member.displayName}*`;

    if (!BROADCAST_TYPES[broadcastType]) {
      return response.send({
        content: `Broadcast type ${broadcastType} is not valid. Valid types: ${Object.keys(BROADCAST_TYPES).join(', ')}`,
      });
    }

    if (broadcastBody.indexOf('@everyone') !== -1) {
      return response.send({
        content: `Pinging @ everyone is currently not allowed. Please remove the ping from your message.`,
      });
    }

    if (broadcastBody.indexOf('@here') !== -1) {
      return response.send({
        content: `Pinging @ here is currently not allowed. Please remove the ping from your message.`,
      });
    }

    return Rx.Observable
      .of('')
      .flatMap(() => this.broadcastService.broadcastAllowed(guild, broadcastType).filter(Boolean))
      .flatMap(() => this.broadcastService.confirmBroadcast(context, broadcastType, broadcastBody).filter(Boolean))
      .flatMap(() => response.send({content: `Ok, let me broadcast that then.`}))
      .flatMap(() => this.broadcastService.broadcastMessage(broadcastType, broadcastBody))
      .count(() => true)
      .flatMap((sentMessages) => response.send({content: `Done. Broadcasted to ${sentMessages} servers`}))
      .catch((error) => {
        if (error instanceof BroadcastingNotAllowedError) {
          return response.send({content: `I'm sorry, but sending ${broadcastType} broadcasts from this server is not allowed.`});
        }
        else if (error instanceof BroadcastCanceledError) {
          return response.send({content: `Ok. Broadcast canceled`});
        }
        else {
          return Rx.Observable.throw(error);
        }
      });
  },
};
