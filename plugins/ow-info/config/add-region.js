const {of, throwError} = require('rxjs');
const {map, catchError} = require('rxjs/operators');

const {RegionNotFoundError} = require('../errors');
const {findRole} = require("../../../lib/role-utilities");

module.exports = {
  name: 'addRegion',
  description: 'Adds an Overwatch region, and map it to a role',

  inputs: [
    {
      name: 'regionName',
      description: 'The name of region to add',
      required: true,
    },
    {
      name: 'role',
      description: 'The name the the role to map the region to',
      required: true,
    },
  ],

  onListen() {
    this.regionService = this.chaos.getService('ow-info', 'regionService');
  },

  run(context) {
    let guild = context.guild;

    let regionName = context.inputs.regionName;
    let roleString = context.inputs.role;

    if (!regionName) {
      return of({
        status: 400,
        content: `a region name is required`,
      });
    }

    if (!roleString) {
      return of({
        status: 400,
        content: `a role is to map the region to is required`,
      });
    }

    let role = findRole(guild, roleString);
    if (!role) {
      return of({
        status: 400,
        content: `The role '${roleString}' could not be found.`,
      });
    }

    return this.regionService.mapRegion(guild, regionName, role).pipe(
      map((mappedAlias) => ({
        ...mappedAlias,
        role: guild.roles.get(mappedAlias.roleId),
      })),
      map((mappedAlias) => ({
        status: 200,
        content: `Mapped the region ${mappedAlias.name} to ${mappedAlias.role.name}`,
      })),
      catchError((error) => {
        if (error instanceof RegionNotFoundError) {
          return of({status: 400, content: error.message});
        } else {
          return throwError(error);
        }
      }),
    );
  },
};
