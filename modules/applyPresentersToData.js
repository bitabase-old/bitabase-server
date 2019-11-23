const righto = require('righto');
const evaluate = require('./evaluate');

function presentDataSingle (collectionConfig, data, user, callback) {
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

function presentData (collectionConfig, data, user, callback) {
  if (Array.isArray(data)) {
    const presenterJobs = data.map(record => {
      return righto(presentDataSingle, collectionConfig, record, user);
    });

    return righto.all(presenterJobs)(callback);
  }

  presentDataSingle(collectionConfig, data, user, callback);
}

module.exports = presentData;
