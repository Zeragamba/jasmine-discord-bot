const {of, throwError} = require('rxjs');
const {map, flatMap, catchError} = require('rxjs/operators');

const {RegionNotFoundError} = require('../errors');

module.exports = {
  name: 'addRegionAlias',
  description: 'Adds an alias for a region',

  args: [
    {
      name: 'alias',
      description: 'The name of alias',
      required: true,
    },
    {
      name: 'region',
      description: 'The name of the region the alias is for',
      required: true,
    },
  ],

  run(context) {
    const regionService = this.chaos.getService('ow-info', 'regionService');

    return of('').pipe(
      flatMap(() => regionService.mapAlias(context.guild, context.args.alias, context.args.region)),
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
