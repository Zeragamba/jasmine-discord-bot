const {of, throwError} = require('rxjs');
const {map, flatMap, catchError} = require('rxjs/operators');
const {RoleNotFoundError} = require('chaos-core').errors;

const {RegionNotFoundError} = require('../errors');

module.exports = {
  name: 'addRegion',
  description: 'Adds an Overwatch region, and map it to a role',

  args: [
    {
      name: 'region',
      description: 'The name of region to add',
      required: true,
    },
    {
      name: 'role',
      description: 'The name the the role to map the region to',
      required: true,
    },
  ],

  run(context) {
    const roleService = this.chaos.getService('core', 'RoleService');
    const regionService = this.chaos.getService('ow-info', 'RegionService');

    return of('').pipe(
      flatMap(() => roleService.findRole(context.guild, context.args.role)),
      flatMap((role) => regionService.mapRegion(context.guild, context.args.region, role)),
      map((region) => ({
        region,
        role: context.guild.roles.get(region.roleId),
      })),
      map(({region, role}) => ({
        status: 200,
        content: `Mapped the region ${region.name} to ${role.name}`,
      })),
      catchError((error) => {
        switch (true) {
          case error instanceof RoleNotFoundError:
          case error instanceof RegionNotFoundError:
            return of({status: 400, content: error.message});
          default:
            return throwError(error);
        }
      }),
    );
  },
};
