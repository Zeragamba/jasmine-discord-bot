const {RoleNotFoundError} = require("chaos-core").errors;

module.exports = {
  name: 'setLiveRole',
  description: `Set role to assign when a user goes live`,

  args: [
    {
      name: 'role',
      required: true,
    },
  ],

  async run(context) {
    try {
      let role = await this.chaos.getService('core', 'RoleService')
        .findRole(context.guild, context.args.role);
      role = await this.chaos.getService('streaming', 'streamingService')
        .setLiveRole(context.guild, role);

      return {
        status: 200,
        content: `Live streamers will now be given the ${role.name} role.`,
      };
    } catch (error) {
      if (error instanceof RoleNotFoundError) {
        return {
          status: 400,
          content: `The role '${context.args.role}' could not be found.`,
        };
      } else {
        throw error;
      }
    }
  },
};
