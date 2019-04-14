class BroadcastError extends Error {
  constructor(message) {
    super(message);
    this.name = "BroadcastError";
  }
}

class BroadcastingNotAllowedError extends BroadcastError {
  constructor(message) {
    super(message);
    this.name = "BroadcastingNotAllowedError";
  }
}

class BroadcastCanceledError extends BroadcastError {
  constructor() {
    super(`Broadcast canceled`);
  }
}

class InvalidBroadcastError extends BroadcastError {
  constructor(message) {
    super(message);
    this.name = "InvalidBroadcastError";
  }
}

module.exports = {
  BroadcastError,
  BroadcastingNotAllowedError,
  BroadcastCanceledError,
  InvalidBroadcastError,
};
