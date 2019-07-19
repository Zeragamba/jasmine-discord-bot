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

  run(context, response) {
    const broadcastService = this.chaos.getService('owMains', 'broadcastService');
    const guild = context.guild;
    const broadcastType = context.args.type.toLowerCase();
    const broadcastBody = context.args.message + `\n*- ${context.member.displayName}*`;

    return of('').pipe(
      tap(() => broadcastService.checkBroadcastAllowed(guild)),
      tap(() => broadcastService.checkValidBroadcast(broadcastType, broadcastBody)),
      flatMap(() => broadcastService.confirmBroadcast(context, broadcastType, broadcastBody)),
      filter(Boolean),
      flatMap(() => response.send({content: `Ok, let me broadcast that then.`})),
      flatMap(() => broadcastService.broadcastMessage(broadcastType, broadcastBody)),
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
