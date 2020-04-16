module.exports = {
  name: 'removeLiveRole',
  description: `Stop assigning a role when a user goes live`,

  async run(context) {
    await this.chaos.getService('streaming', 'StreamingService').removeLiveRole(context.guild);

    return {
      status: 200,
      content: `Live streamers will no longer receive a role`,
    };
  },
};
