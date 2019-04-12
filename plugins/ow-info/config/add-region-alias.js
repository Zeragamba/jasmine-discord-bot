const Rx = require('rx');

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

  configureAction() {
    this.regionService = this.chaos.getService('ow-info', 'regionService');
  },

  run(context) {
    let guild = context.guild;

    let aliasName = context.inputs.aliasName;
    let regionName = context.inputs.regionName;

    if (!aliasName) {
      return Rx.Observable.of({
        status: 400,
        content: `an alias is required`,
      });
    }

    if (!regionName) {
      return Rx.Observable.of({
        status: 400,
        content: `the region to map the alias to is required`,
      });
    }

    return this.regionService
      .mapAlias(guild, aliasName, regionName)
      .map((mappedAlias) => ({
        status: 200,
        content: `Added alias ${mappedAlias.name} for ${mappedAlias.region}`,
      }))
      .catch((error) => {
        if (error instanceof RegionNotFoundError) {
          return Rx.Observable.of({status: 400, content: error.message});
        }
        else {
          return Rx.Observable.throw(error);
        }
      });
  },
};
