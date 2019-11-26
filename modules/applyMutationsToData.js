const righto = require('righto');
const evaluate = require('./evaluate');

function mutateData (collectionConfig, body, user, headers, callback) {
  const { mutations } = collectionConfig;

  const mutatorFunctions = (mutations || [])
    .map(mutation => {
      return righto(evaluate, mutation, { body, user, headers });
    });

  righto.all(mutatorFunctions)(function (error, mutations) {
    if (error) {
      return callback(error);
    }

    mutations.forEach(mutation => {
      body = mutation;
    });

    callback(null, body);
  });
}

module.exports = mutateData;
