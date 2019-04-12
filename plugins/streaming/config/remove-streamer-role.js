const Rx = require('rx');

const { RoleNotFoundError } = require('../lib/errors');

module.exports = {
  name: 'removeStreamerRole',
  description: `Removes the limit on who can receive the live role`,

  configureAction() {
    this.streamingService = this.chaos.getService('streaming', 'streamingService');
  },

  run(context) {
    let guild = context.guild;

    return this.streamingService
      .removeStreamerRole(guild)
      .map((prevStreamingRole) => ({
        status: 200,
        content: `I will no longer limit adding the live role to users with the role ${prevStreamingRole.name}`,
      }))
      .catch((error) => {
        if (error instanceof RoleNotFoundError) {
          return Rx.Observable.of({
            status: 400,
            content: `No streamer role was set.`,
          });
        }
      });
  },
};
