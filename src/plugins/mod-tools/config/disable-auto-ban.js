const {map} = require('rxjs/operators');

module.exports = {
  name: 'disableAutoBan',
  description: 'Disables autobanning of users',

  run(context) {
    let autoBanService = this.chaos.getService('modTools', 'autoBanService');

    let guild = context.guild;

    return autoBanService.setAutoBansEnabled(guild, false).pipe(
      map(() => ({
        status: 200,
        content: `Autobanning is now disabled.`,
      })),
    );
  },
};
