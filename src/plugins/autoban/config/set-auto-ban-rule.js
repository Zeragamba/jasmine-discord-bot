const {RuleNotFoundError} = require("../../mod-tools/errors");

module.exports = {
  name: 'setAutoBanRule',
  description: 'Enables or disables auto ban rules',

  args: [
    {
      name: 'rule',
      description: `the rule to enable or disable`,
      required: true,
    },
    {
      name: 'enabled',
      description: 'set the state of the rule',
      required: true,
    },
  ],

  async run(context) {
    let autoBanService = this.chaos.getService('modTools', 'autoBanService');
    let guild = context.guild;

    let rule = context.args.rule;
    let enabled = context.args.enabled === "true";

    try {
      enabled = await autoBanService.setAutoBanRule(guild, rule, enabled);
      return {
        status: 200,
        content: `${rule} is now ${enabled ? "enabled" : "disabled"}`,
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
