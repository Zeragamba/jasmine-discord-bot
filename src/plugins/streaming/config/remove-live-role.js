const {map} = require('rxjs/operators');

module.exports = {
  name: 'removeLiveRole',
  description: `Stop assigning a role when a user goes live`,

  run(context) {
    const streamingService = this.chaos.getService('streaming', 'StreamingService');
    const guild = context.guild;

    return streamingService.removeLiveRole(guild).pipe(
      map(() => ({
        status: 200,
        content: `Live streamers will no longer receive a role`,
      })),
    );
  },
};
