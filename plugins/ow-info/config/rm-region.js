const Rx = require('rx');

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
      return Rx.Observable.of({
        status: 400,
        content: `the region to remove is required`,
      });
    }

    return this.regionService
      .removeRegion(guild, regionName)
      .map((removedRegion) => ({
        status: 200,
        content: `Removed region '${removedRegion}'`,
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
