module.exports = {
  name: 'enableAutoBan',
  description: 'Enables autobanning of users',

  async run(context) {
    let autoBanService = this.chaos.getService('modTools', 'autoBanService');

    let guild = context.guild;

    await autoBanService.setAutoBansEnabled(guild, true);
    return {
      status: 200,
      content: `Autobanning is now enabled.`,
    };
  },
};
