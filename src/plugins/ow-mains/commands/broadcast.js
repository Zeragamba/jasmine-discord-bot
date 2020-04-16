const {Command} = require('chaos-core');

const {
  BroadcastingNotAllowedError,
  BroadcastCanceledError,
  InvalidBroadcastError,
} = require('../errors');

class BroadcastCommand extends Command {
  constructor(chaos) {
    super(chaos, {
      name: 'broadcast',
      description: 'broadcast a message to all connected servers',
      permissions: ['broadcaster'],

      args: [
        {
          name: 'type',
          description: `the type of broadcast message.`,
          required: true,
        },
        {
          name: 'message',
          description: 'the message to broadcast.',
          required: true,
          greedy: true,
        },
      ],
    });
  }

  execCommand(context, response) {
    const OwmnService = this.chaos.getService('owMains', 'OwmnService');
    if (context.guild.id === OwmnService.owmnServerId) {
      return super.execCommand(context, response);
    }
  }

  async run(context, response) {
    const broadcastService = this.chaos.getService('owMains', 'broadcastService');
    const guild = context.guild;
    const broadcastType = context.args.type.toLowerCase();
    const broadcastBody = context.args.message + `\n*- ${context.member.displayName}*`;

    try {
      broadcastService.checkBroadcastAllowed(guild);
      broadcastService.checkValidBroadcast(broadcastType, broadcastBody);
      if (await broadcastService.confirmBroadcast(context, broadcastType, broadcastBody)) {
        await response.send({content: `Ok, let me broadcast that then.`});
        const sentMessages = await broadcastService.broadcastMessage(broadcastType, broadcastBody);
        await response.send({content: `Done. Broadcasted to ${sentMessages.length} servers`});
      }
    } catch (error) {
      if (error instanceof InvalidBroadcastError) {
        return response.send({content: error.message});
      } else if (error instanceof BroadcastingNotAllowedError) {
        // User is not allowed to broadcast. Ignore.
      } else if (error instanceof BroadcastCanceledError) {
        return response.send({content: `Ok. Broadcast canceled`});
      } else {
        throw error;
      }
    }
  }
}

module.exports = BroadcastCommand;
