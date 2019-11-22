const righto = require('righto');
const evaluate = require('./evaluate');

function presentData (collectionConfig, data, user, callback) {
  const { presenters } = collectionConfig;

  const presenterFunctions = (presenters || [])
    .map(presenter => {
      return righto(evaluate, presenter, { data, user });
    });

  righto.all(presenterFunctions)(function (error, presenters) {
    if (error) {
      return callback(error);
    }

    presenters.forEach(presenter => {
      data = { ...data, ...presenter };
    });

    data = JSON.parse(JSON.stringify(data));

    callback(null, data);
  });
}

module.exports = presentData
