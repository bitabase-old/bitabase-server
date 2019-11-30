const righto = require('righto');
const evaluate = require('./evaluate');

function applyTransducersToData (collectionConfig, scope, callback) {
  const { transducers } = collectionConfig;

  if (!transducers || transducers.length === 0) {
    return callback(null, scope.body);
  }

  const reject = (statusCode, message) => {
    return righto.fail({
      statusCode, friendly: message
    });
  };

  const finalBody = righto.reduce(
    transducers,
    function (body, next) {
      return righto(evaluate, next, {
        ...scope,
        reject,
        body
      }).get(result => {
        return typeof result === 'object' ? result : righto.fail({
          script: next,
          scope,
          returned: result,
          error: {
            code: 'SCRIPT_EVALUATE_RUNTIME',
            message: 'transducer did not return an object'
          }
        });
      });
    },
    scope.body
  );

  finalBody(callback);
}

module.exports = applyTransducersToData;
