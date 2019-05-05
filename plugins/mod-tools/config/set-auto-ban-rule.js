const {of, throwError} = require('rxjs');
const {map, catchError} = require('rxjs/operators');

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

    return autoBanService.setAutoBanRule(guild, rule, enabled).pipe(
      map(([rule, enabled]) => ({
        status: 200,
        content: `${rule} is now ${enabled ? "enabled" : "disabled"}`,
      })),
      catchError((error) => {
        if (error instanceof AutoBanError) {
          return handleAutoBanError(error, context);
        }

        return throwError(error);
      }),
    );
  },
};

function handleAutoBanError(error) {
  if (error instanceof RuleNotFoundError) {
    return of(({
      status: 404,
      content: error.message,
    }));
  }

  return throwError(error);
}
