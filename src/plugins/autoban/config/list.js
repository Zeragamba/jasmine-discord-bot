const autoBanRules = require('../rules');

module.exports = {
  name: 'list',
  description: 'List current auto ban rules',

  async run(context) {
    let autoBanService = this.chaos.getService('autoban', 'AutoBanService');
    let rules = [];

    for (const rule of Object.values(autoBanRules)) {
      const isEnabled = await autoBanService.isRuleEnabled(context.guild, rule);
      rules.push({
        name: `**${rule.name}** (${isEnabled ? "Enabled" : "Disabled"})`,
        value: rule.description,
      });
    }

    return {
      status: 200,
      content: `Available Rules:`,
      embed: {fields: rules},
    };
  },
};
