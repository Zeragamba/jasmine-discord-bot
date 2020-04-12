const {from, of, throwError} = require('rxjs');
const {map, catchError} = require('rxjs/operators');

const {RegionNotFoundError} = require('../errors');

module.exports = {
  name: 'rmRegion',
  description: 'Removes an Overwatch region',

  args: [
    {
      name: 'region',
      description: 'The name of the region to remove',
      required: true,
    },
  ],

  run(context) {
    const regionService = this.chaos.getService('ow-info', 'regionService');

    return from(regionService.removeRegion(context.guild, context.args.region)).pipe(
      map((removedRegion) => ({
        status: 200,
        content: `Removed region '${removedRegion}'`,
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
