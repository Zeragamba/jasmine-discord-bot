const {RoleNotFoundError} = require('../lib/errors');

module.exports = {
  name: 'removeStreamerRole',
  description: `Removes the limit on who can receive the live role`,

  async run(context) {
    try {
      const prevRole = await this.chaos.getService('streaming', 'StreamingService')
        .removeStreamerRole(context.guild);
      return {
        status: 200,
        content: `I will no longer limit adding the live role to users with the role ${prevRole.name}`,
      };
    } catch (error) {
      if (error instanceof RoleNotFoundError) {
        return {
          status: 400,
          content: `No streamer role was set.`,
        };
      } else {
        throw error;
      }
    }
  },
};
