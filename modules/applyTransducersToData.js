const righto = require('righto');
const evaluate = require('./evaluate');
const ErrorWithObject = require('error-with-object');

function applyTransducersToData (collectionConfig, scope, callback) {
  const { transducers } = collectionConfig;

  if (!transducers || transducers.length === 0) {
    return callback(null, scope.body);
  }

  const reject = (statusCode, message) => {
    return righto.fail({
      statusCode, friendly: message
    })
  }

  debugger

  const finalBody = righto.reduce(
    transducers,
    function (body, next) {
      return righto(evaluate, next, {
        ...scope,
        reject,
        body
      }).get(result => {
        return typeof result === 'object' ? result : righto.fail('Must return an object')
      });
    },
    scope.body
  );

  finalBody(callback);
}

module.exports = applyTransducersToData;
