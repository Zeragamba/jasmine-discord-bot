module.exports = {
  name: 'disableAutoBan',
  description: 'Disables autobanning of users',

  async run(context) {
    await this.chaos.getService('modTools', 'autoBanService')
      .setAutoBansEnabled(context.guild, false).toPromise();

    return {
      status: 200,
      content: `Autobanning is now disabled.`,
    };
  },
};
