const {RuleNotFoundError} = require("../errors");

module.exports = {
  name: 'enable',
  description: 'Enables an auto ban rule',

  args: [
    {
      name: 'rule',
      description: `the rule to enable or disable`,
      required: true,
    },
  ],

  async run(context) {
    let autoBanService = this.chaos.getService('autoban', 'AutoBanService');

    try {
      const rule = await autoBanService.getRule(context.args.rule);
      await autoBanService.setRuleEnabled(context.guild, rule, true);

      return {
        status: 200,
        content: `${rule.name} is now enabled`,
      };
    } catch (error) {
      if (error instanceof RuleNotFoundError) {
        return {
          status: 404,
          content: error.message,
        };
      }
      throw error;
    }
  },
};
