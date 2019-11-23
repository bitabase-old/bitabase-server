const righto = require('righto');
const evaluate = require('./evaluate');

function mutateData (collectionConfig, body, user, callback) {
  const { schema, mutations } = collectionConfig;

  Object.keys(body).forEach(field => {
    if (schema[field].includes('array')) {
      body[field] = JSON.stringify(body[field]);
    }
  });

  const mutatorFunctions = (mutations || [])
    .map(mutation => {
      return righto(evaluate, mutation, { body, user });
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
