const {of, throwError} = require('rxjs');
const {map, catchError} = require('rxjs/operators');

const {
  AliasNotFoundError,
} = require('../errors');

module.exports = {
  name: 'rmRegionAlias',
  description: 'removes an Overwatch region alias',

  inputs: [
    {
      name: 'alias',
      description: 'The name of the alias to remove',
      required: true,
    },
  ],

  run(context) {
    const regionService = this.chaos.getService('ow-info', 'regionService');
    const guild = context.guild;

    const regionName = context.inputs.alias;

    if (!regionName) {
      return of({
        status: 400,
        content: `the region to remove is required`,
      });
    }

    return regionService.removeAlias(guild, regionName).pipe(
      map((removedAlias) => ({
        status: 200,
        content: `Removed region alias '${removedAlias}'`,
      })),
      catchError((error) => {
        if (error instanceof AliasNotFoundError) {
          return of({status: 400, content: error.message});
        } else {
          return throwError(error);
        }
      }),
    );
  },
};
