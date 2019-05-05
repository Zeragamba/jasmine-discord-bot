const {of, throwError} = require('rxjs');
const {map, catchError} = require('rxjs/operators');

const {RegionNotFoundError} = require('../errors');

module.exports = {
  name: 'rmRegion',
  description: 'Removes an Overwatch region',

  inputs: [
    {
      name: 'regionName',
      description: 'The name of the region to remove',
      required: true,
    },
  ],

  onListen() {
    this.regionService = this.chaos.getService('ow-info', 'regionService');
  },

  run(context) {
    let guild = context.guild;

    let regionName = context.inputs.regionName;

    if (!regionName) {
      return of({
        status: 400,
        content: `the region to remove is required`,
      });
    }

    return this.regionService.removeRegion(guild, regionName).pipe(
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
