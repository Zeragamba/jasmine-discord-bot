const {RoleNotFoundError} = require("chaos-core").errors;
const {of} = require('rxjs');
const {map, flatMap, catchError} = require('rxjs/operators');

module.exports = {
  name: 'setLiveRole',
  description: `Set role to assign when a user goes live`,

  args: [
    {
      name: 'role',
      required: true,
    },
  ],

  run(context) {
    const roleService = this.chaos.getService('core', 'RoleService');
    const streamingService = this.chaos.getService('streaming', 'streamingService');

    const guild = context.guild;
    const roleString = context.args.role;

    return of('').pipe(
      flatMap(() => roleService.findRole(guild, roleString)),
      flatMap((role) => streamingService.setLiveRole(guild, role)),
      map((role) => ({
        status: 200,
        content: `Live streamers will now be given the ${role.name} role.`,
      })),
      catchError((error) => {
        if (error instanceof RoleNotFoundError) {
          return of({
            status: 400,
            content: `The role '${roleString}' could not be found.`,
          });
        }
      }),
    );
  },
};
