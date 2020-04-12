module.exports = {
  name: 'listAutoBanRules',
  description: 'List current auto ban rules',

  async run(context) {
    let autoBanService = this.chaos.getService('modTools', 'autoBanService');

    let guild = context.guild;

    const [autoBanEnabled, rules] = await Promise.all([
      autoBanService.isAutoBanEnabled(guild).toPromise(),
      autoBanService.getRules(guild).toPromise(),
    ]);

    let message = [
      `**Autoban Rules:**`,
      `(Autoban enabled: ${autoBanEnabled})`,
    ];

    Object.entries(rules).forEach(([rule, value]) => {
      message.push(`    ${rule}: ${value}`);
    });

    return {
      status: 200,
      content: message.join('\n'),
    };
  },
};
