const righto = require('righto');
const evaluate = require('./evaluate');
const ErrorWithObject = require('error-with-object');

function applyTransducersToData (collectionConfig, scope, callback) {
  const { transducers } = collectionConfig;

  if (!transducers || transducers.length === 0) {
    return callback(null, scope.body);
  }

  let alreadyRejected = false;
  const reject = (statusCode, message) => {
    !alreadyRejected && callback(new ErrorWithObject({
      statusCode, friendly: message
    }));
    alreadyRejected = true;
  };

  const finalBody = righto.reduce(
    transducers,
    function (body, next) {
      const evaulatedResult = righto(evaluate, next, {
        ...scope,
        reject,
        body
      });

      return evaulatedResult;
    },
    scope.body
  );

  finalBody(callback);
}

module.exports = applyTransducersToData;
