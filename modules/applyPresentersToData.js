const righto = require('righto');
const evaluate = require('./evaluate');

function presentDataSingle (collectionConfig, record, user, callback) {
  const { presenters } = collectionConfig;

  const presenterFunctions = (presenters || [])
    .map(presenter => {
      return righto(evaluate, presenter, { record, user });
    });

  righto.all(presenterFunctions)(function (error, presenters) {
    if (error) {
      return callback(error);
    }

    presenters.forEach(presenter => {
      record = presenter;
    });

    record = JSON.parse(JSON.stringify(record));

    callback(null, record);
  });
}

function presentData (collectionConfig, record, user, callback) {
  if (Array.isArray(record)) {
    const presenterJobs = record.map(record => {
      return righto(presentDataSingle, collectionConfig, record, user);
    });

    return righto.all(presenterJobs)(callback);
  }

  presentDataSingle(collectionConfig, record, user, callback);
}

module.exports = presentData;
