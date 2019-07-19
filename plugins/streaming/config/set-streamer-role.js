const {of} = require('rxjs');
const {map} = require('rxjs/operators');

const {findRole} = require("../../../lib/role-utilities");

module.exports = {
  name: 'setStreamerRole',
  description: `Set a role to limit who can receive the live role`,

  inputs: [
    {
      name: 'role',
      required: true,
    },
  ],

  run(context) {
    const streamingService = this.chaos.getService('streaming', 'StreamingService');
    let guild = context.guild;

    const roleString = context.inputs.role;
    if (!roleString) {
      return of({
        status: 400,
        content: `A role to watch is required`,
      });
    }

    const role = findRole(guild, roleString);
    if (!role) {
      return of({
        status: 400,
        content: `The role '${roleString}' could not be found.`,
      });
    }

    return streamingService.setStreamerRole(guild, role).pipe(
      map((streamerRole) => ({
        status: 200,
        content: `I will now only give the live role to users with the ${streamerRole.name} role`,
      })),
    );
  },
};
