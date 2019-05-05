const {of} = require('rxjs');
const {map, catchError} = require('rxjs/operators');

const {RoleNotFoundError} = require('../lib/errors');

module.exports = {
  name: 'removeStreamerRole',
  description: `Removes the limit on who can receive the live role`,

  onListen() {
    this.streamingService = this.chaos.getService('streaming', 'streamingService');
  },

  run(context) {
    let guild = context.guild;

    return this.streamingService.removeStreamerRole(guild).pipe(
      map((prevStreamingRole) => ({
        status: 200,
        content: `I will no longer limit adding the live role to users with the role ${prevStreamingRole.name}`,
      })),
      catchError((error) => {
        if (error instanceof RoleNotFoundError) {
          return of({
            status: 400,
            content: `No streamer role was set.`,
          });
        }
      }),
    );
  },
};
