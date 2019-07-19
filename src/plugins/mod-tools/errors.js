class AutoBanError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AutoBanError';
  }
}

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
