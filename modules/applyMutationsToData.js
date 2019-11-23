const righto = require('righto');
const evaluate = require('./evaluate');

function mutateData (collectionConfig, data, user, callback) {
  const { schema, mutations } = collectionConfig;

  Object.keys(data).forEach(field => {
    if (schema[field].includes('array')) {
      data[field] = JSON.stringify(data[field]);
    }
  });

  const mutatorFunctions = (mutations || [])
    .map(mutation => {
      return righto(evaluate, mutation, { data, user });
    });

  righto.all(mutatorFunctions)(function (error, mutations) {
    if (error) {
      return callback(error);
    }

    mutations.forEach(mutation => {
      data = mutation;
    });

    callback(null, data);
  });
}

module.exports = mutateData;
