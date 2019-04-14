const Rx = require('rx');

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

  onListen() {
    this.regionService = this.chaos.getService('ow-info', 'regionService');
  },

  run(context) {
    let guild = context.guild;

    let regionName = context.inputs.alias;

    if (!regionName) {
      return Rx.Observable.of({
        status: 400,
        content: `the region to remove is required`,
      });
    }

    return this.regionService
      .removeAlias(guild, regionName)
      .map((removedAlias) => ({
        status: 200,
        content: `Removed region alias '${removedAlias}'`,
      }))
      .catch((error) => {
        if (error instanceof AliasNotFoundError) {
          return Rx.Observable.of({status: 400, content: error.message});
        }
        else {
          return Rx.Observable.throw(error);
        }
      });
  },
};
