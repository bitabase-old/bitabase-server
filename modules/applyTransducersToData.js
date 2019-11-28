const righto = require('righto');
const evaluate = require('./evaluate');
const ErrorWithObject = require('error-with-object');

function applyTransducersToData (collectionConfig, scope, callback) {
  const { transducers } = collectionConfig;

  let alreadyRejected = false;
  const reject = (statusCode, message) => {
    !alreadyRejected && callback(new ErrorWithObject({
      statusCode, friendly: message
    }));
    alreadyRejected = true;
  };

  const transformFunctions = (transducers || [])
    .map(transformation => {
      return righto(evaluate, transformation, {
        ...scope,
        reject
      });
    });

  righto.all(transformFunctions)(function (error, transducers) {
    if (error) {
      return callback(error);
    }

    transducers.forEach(transformation => {
      scope.body = transformation;
    });

    callback(null, scope.body);
  });
}

module.exports = applyTransducersToData;
