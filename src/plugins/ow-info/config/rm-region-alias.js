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

  async run(context) {
    try {
      const regionService = this.chaos.getService('ow-info', 'regionService');
      const removedAlias = await regionService.removeAlias(context.guild, context.args.alias);
      return {
        status: 200,
        content: `Removed region alias '${removedAlias}'`,
      };
    } catch (error) {
      if (error instanceof AliasNotFoundError) {
        return {status: 400, content: error.message};
      } else {
        throw error;
      }
    }
  },
};
