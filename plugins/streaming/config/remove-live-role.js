module.exports = {
  name: 'removeLiveRole',
  description: `Stop assigning a role when a user goes live`,

  configureAction() {
    this.streamingService = this.chaos.getService('streaming', 'StreamingService');
  },

  run(context) {
    let guild = context.guild;

    return this.streamingService
      .removeLiveRole(guild)
      .map(() => ({
        status: 200,
        content: `Live streamers will no longer receive a role`,
      }));
  },
};
