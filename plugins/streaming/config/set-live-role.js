const Rx = require('rx');

const { findRole } = require("../../../lib/role-utilities");

module.exports = {
  name: 'setLiveRole',
  description: `Set role to assign when a user goes live`,

  inputs: [
    {
      name: 'role',
      required: true,
    },
  ],

  configureAction() {
    this.streamingService = this.chaos.getService('streaming', 'streamingService');
  },

  run(context) {
    let guild = context.guild;

    let roleString = context.inputs.role;
    if (!roleString) {
      return Rx.Observable.of({
        status: 400,
        content: `A role is to assign users is required`,
      });
    }

    let role = findRole(guild, roleString);
    if (!role) {
      return Rx.Observable.of({
        status: 400,
        content: `The role '${roleString}' could not be found.`,
      });
    }

    return this.streamingService
      .setLiveRole(guild, role)
      .map((role) => ({
        status: 200,
        content: `Live streamers will now be given the ${role.name} role.`,
      }));
  },
};
