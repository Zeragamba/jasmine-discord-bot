const ChaosCore = require('chaos-core');

class AutoBanError extends ChaosCore.errors.ChaosError {}

class RuleNotFoundError extends AutoBanError {
  constructor(rule) {
    super(`The rule ${rule} does not exist.`);
    this.name = 'RuleNotFoundError';
  }
}

module.exports = {
  AutoBanError,
  RuleNotFoundError,
};
