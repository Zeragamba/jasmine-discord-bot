const {RoleNotFoundError} = require('chaos-core').errors;

const {RegionNotFoundError} = require('../errors');

module.exports = {
  name: 'addRegion',
  description: 'Adds an Overwatch region, and map it to a role',

  args: [
    {
      name: 'region',
      description: 'The name of region to add',
      required: true,
    },
    {
      name: 'role',
      description: 'The name the the role to map the region to',
      required: true,
    },
  ],

  async run(context) {
    try {
      const role = await this.chaos.getService('core', 'RoleService')
        .findRole(context.guild, context.args.role);
      const region = await this.chaos.getService('ow-info', 'RegionService')
        .mapRegion(context.guild, context.args.region, role);

      return {
        status: 200,
        content: `Mapped the region ${region.name} to ${role.name}`,
      };
    } catch (error) {
      switch (true) {
        case error instanceof RoleNotFoundError:
        case error instanceof RegionNotFoundError:
          return {status: 400, content: error.message};
        default:
          throw error;
      }
    }
  },
};
