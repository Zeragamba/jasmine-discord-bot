const Rx = require('rx');

const {
  AutoBanError,
  RuleNotFoundError,
} = require("../errors");

module.exports = {
  name: 'setAutoBanRule',
  description: 'Enables or disables auto ban rules',

  inputs: [
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

  run(context) {
    let autoBanService = context.chaos.getService('modTools', 'autoBanService');
    let guild = context.guild;

    let rule = context.inputs.rule;
    let enabled = context.inputs.enabled === "true";

    return autoBanService
      .setAutoBanRule(guild, rule, enabled)
      .map(([rule, enabled]) => ({
        status: 200,
        content: `${rule} is now ${enabled ? "enabled" : "disabled"}`,
      }))
      .catch((error) => {
        if (error instanceof AutoBanError) {
          return handleAutoBanError(error, context);
        }

        return Rx.Observable.throw(error);
      });
  },
};

function handleAutoBanError(error) {
  if (error instanceof RuleNotFoundError) {
    return Rx.Observable.of(({
      status: 404,
      content: error.message,
    }));
  }

  return Rx.Observable.throw(error);
}
