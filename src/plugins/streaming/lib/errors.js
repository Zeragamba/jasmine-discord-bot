const ChaosCore = require("chaos-core");

class StreamingError extends ChaosCore.errors.ChaosError {
}

class RoleNotFoundError extends StreamingError {
}

module.exports = {
  StreamingError,
  RoleNotFoundError,
};
