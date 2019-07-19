class StreamingError extends Error {
  constructor(message) {
    super(message);
    this.name = "StreamingError";
  }
}

class RoleNotFoundError extends StreamingError {
  constructor(message) {
    super(message);
    this.name = "RoleNotFoundError";
  }
}

module.exports = {
  StreamingError,
  RoleNotFoundError,
};
