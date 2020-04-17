const {RuleNotFoundError} = require("../errors");

module.exports = {
  name: 'disable',
  description: 'Disables an auto ban rule',

  args: [
    {
      name: 'rule',
      description: `the rule to disable`,
      required: true,
    },
  ],

  async run(context) {
    let autoBanService = this.chaos.getService('autoban', 'AutoBanService');

    try {
      const rule = await autoBanService.getRule(context.args.rule);
      await autoBanService.setRuleEnabled(context.guild, rule, false);

      return {
        status: 200,
        content: `${rule.name} is now disabled`,
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
