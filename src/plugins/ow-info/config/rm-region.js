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

  async run(context) {
    try {
      const removedRegion = await this.chaos.getService('ow-info', 'regionService')
        .removeRegion(context.guild, context.args.region);

      return {
        status: 200,
        content: `Removed region '${removedRegion}'`,
      };
    } catch (error) {
      if (error instanceof RegionNotFoundError) {
        return {status: 400, content: error.message};
      } else {
        throw error;
      }
    }
  },
};
