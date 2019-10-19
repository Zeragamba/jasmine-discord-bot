const {map} = require('rxjs/operators');

module.exports = {
  name: 'enableAutoBan',
  description: 'Enables autobanning of users',

  run(context) {
    let autoBanService = this.chaos.getService('modTools', 'autoBanService');

    let guild = context.guild;

    return autoBanService.setAutoBansEnabled(guild, true).pipe(
      map(() => ({
        status: 200,
        content: `Autobanning is now enabled.`,
      })),
    );
  },
};
