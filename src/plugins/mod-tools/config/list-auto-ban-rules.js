const {combineLatest} = require('rxjs');
const {map} = require('rxjs/operators');

module.exports = {
  name: 'listAutoBanRules',
  description: 'List current auto ban rules',

  run(context) {
    let autoBanService = this.chaos.getService('modTools', 'autoBanService');

    let guild = context.guild;

    return combineLatest(
      autoBanService.isAutoBanEnabled(guild),
      autoBanService.getRules(guild),
    ).pipe(
      map(([autoBanEnabled, rules]) => {
        let message = [
          `**Autoban Rules:**`,
          `(Autoban enabled: ${autoBanEnabled})`,
        ];

        Object.entries(rules).forEach(([rule, value]) => {
          message.push(`    ${rule}: ${value}`);
        });

        return message.join('\n');
      }),
      map((content) => ({
        status: 200,
        content,
      })),
    );
  },
};
