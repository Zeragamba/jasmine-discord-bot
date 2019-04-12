module.exports = {
  name: 'enableAutoBan',
  description: 'Enables autobanning of users',

  run(context) {
    let autoBanService = context.chaos.getService('modTools', 'autoBanService');

    let guild = context.guild;

    return autoBanService
      .setAutoBansEnabled(guild, true)
      .map(() => ({
        status: 200,
        content: `*pulls out a ban hammer*\nAutobanning is now enabled.`,
      }));
  },
};
