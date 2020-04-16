const {RoleNotFoundError} = require("chaos-core").errors;

module.exports = {
  name: 'setStreamerRole',
  description: `Set a role to limit who can receive the live role`,

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
      let streamerRole = await this.chaos.getService('streaming', 'StreamingService')
        .setStreamerRole(context.guild, role);

      return {
        status: 200,
        content: `I will now only give the live role to users with the ${streamerRole.name} role`,
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
