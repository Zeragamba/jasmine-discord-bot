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

  async run(context) {
    try {
      const mappedAlias = await this.chaos.getService('ow-info', 'regionService')
        .mapAlias(context.guild, context.args.alias, context.args.region);
      return {
        status: 200,
        content: `Added alias ${mappedAlias.name} for ${mappedAlias.region}`,
      };
    } catch (error) {
      if (error instanceof RegionNotFoundError) {
        return {
          status: 400,
          content: error.message,
        };
      } else {
        throw error;
      }
    }
  },
};
