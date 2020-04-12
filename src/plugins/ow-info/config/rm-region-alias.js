const {from, of, throwError} = require('rxjs');
const {map, catchError} = require('rxjs/operators');

const {
  AliasNotFoundError,
} = require('../errors');

module.exports = {
  name: 'rmRegionAlias',
  description: 'removes an Overwatch region alias',

  args: [
    {
      name: 'alias',
      description: 'The name of the alias to remove',
      required: true,
    },
  ],

  run(context) {
    const regionService = this.chaos.getService('ow-info', 'regionService');
    return from(regionService.removeAlias(context.guild, context.args.alias)).pipe(
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
