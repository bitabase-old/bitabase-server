const righto = require('righto');
const evaluate = require('./evaluate');

function applyTransformsToData (collectionConfig, body, user, headers, callback) {
  const { transforms } = collectionConfig;

  const transformFunctions = (transforms || [])
    .map(transformation => {
      return righto(evaluate, transformation, { body, user, headers });
    });

  righto.all(transformFunctions)(function (error, transforms) {
    if (error) {
      return callback(error);
    }

    transforms.forEach(transformation => {
      body = transformation;
    });

    callback(null, body);
  });
}

module.exports = applyTransformsToData;
