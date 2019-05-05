const {bindCallback} = require('rxjs');
const {flatMap} = require('rxjs/operators');

function flatAwait(awaitFunc) {
  return (source) => source.pipe(
    flatMap(() => bindCallback(awaitFunc)()),
  );
}

module.exports = flatAwait;