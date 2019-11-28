const righto = require('righto');
const evaluate = require('./evaluate');

function applyTransducersToData (collectionConfig, body, user, headers, callback) {
  const { transducers } = collectionConfig;

  const transformFunctions = (transducers || [])
    .map(transformation => {
      return righto(evaluate, transformation, { body, user, headers });
    });

  righto.all(transformFunctions)(function (error, transducers) {
    if (error) {
      return callback(error);
    }

    transducers.forEach(transformation => {
      body = transformation;
    });

    callback(null, body);
  });
}

module.exports = applyTransducersToData;
