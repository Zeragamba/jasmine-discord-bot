const {of, throwError} = require('rxjs');
const {flatMap, tap, catchError, count, filter} = require('rxjs/operators');

const {
  BroadcastingNotAllowedError,
  BroadcastCanceledError,
  InvalidBroadcastError,
} = require('../errors');

module.exports = {
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

  onListen() {
    this.broadcastService = this.chaos.getService('owMains', 'broadcastService');
  },

  run(context, response) {
    let guild = context.guild;
    let broadcastType = context.args.type.toLowerCase();
    let broadcastBody = context.args.message + `\n*- ${context.member.displayName}*`;

    return of('').pipe(
      tap(() => this.broadcastService.checkBroadcastAllowed(guild)),
      tap(() => this.broadcastService.checkValidBroadcast(broadcastType, broadcastBody)),
      flatMap(() => this.broadcastService.confirmBroadcast(context, broadcastType, broadcastBody)),
      filter(Boolean),
      flatMap(() => response.send({content: `Ok, let me broadcast that then.`})),
      flatMap(() => this.broadcastService.broadcastMessage(broadcastType, broadcastBody)),
      count(() => true),
      flatMap((sentMessages) => response.send({content: `Done. Broadcasted to ${sentMessages} servers`})),
      catchError((error) => {
        if (error instanceof InvalidBroadcastError) {
          return response.send({
            content: error.message,
          });
        } else if (error instanceof BroadcastingNotAllowedError) {
          return response.send({
            content: error.message,
          });
        } else if (error instanceof BroadcastCanceledError) {
          return response.send({
            content: `Ok. Broadcast canceled`,
          });
        } else {
          return throwError(error);
        }
      }),
    );
  },
};
