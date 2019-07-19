const {of, throwError} = require('rxjs');
const {map, catchError} = require('rxjs/operators');

const {RegionNotFoundError} = require('../errors');

module.exports = {
  name: 'addRegionAlias',
  description: 'Adds an alias for a region',

  inputs: [
    {
      name: 'aliasName',
      description: 'The name of alias',
      required: true,
    },
    {
      name: 'regionName',
      description: 'The name of the region the alias is for',
      required: true,
    },
  ],

  run(context) {
    const regionService = this.chaos.getService('ow-info', 'regionService');
    const guild = context.guild;

    const aliasName = context.inputs.aliasName;
    const regionName = context.inputs.regionName;

    if (!aliasName) {
      return of({
        status: 400,
        content: `an alias is required`,
      });
    }

    if (!regionName) {
      return of({
        status: 400,
        content: `the region to map the alias to is required`,
      });
    }

    return regionService.mapAlias(guild, aliasName, regionName).pipe(
      map((mappedAlias) => ({
        status: 200,
        content: `Added alias ${mappedAlias.name} for ${mappedAlias.region}`,
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
