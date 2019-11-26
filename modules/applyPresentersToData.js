const righto = require('righto');
const evaluate = require('./evaluate');

function transformArraysProperty (schema, record) {
  const schemaWithId = {
    ...schema,
    id: ['string']
  };

  return Object.keys(schemaWithId)
    .reduce((newRecord, currentProperty) => {
      const fieldIsArray = schemaWithId[currentProperty].includes('array');
      const fieldIsString = typeof record[currentProperty] === 'string';

      if (fieldIsArray && fieldIsString) {
        newRecord[currentProperty] = JSON.parse(record[currentProperty]);
      } else {
        newRecord[currentProperty] = record[currentProperty];
      }

      return newRecord;
    }, {});
}

function presentDataSingle (collectionConfig, record, user, headers, callback) {
  const { presenters } = collectionConfig;

  const presenterFunctions = (presenters || [])
    .map(presenter => {
      return righto(evaluate, presenter, { record, user, headers });
    });

  righto.all(presenterFunctions)(function (error, presenters) {
    if (error) {
      return callback(error);
    }

    presenters.forEach(presenter => {
      record = presenter;
    });

    record = transformArraysProperty(collectionConfig.schema, record);
    callback(null, record);
  });
}

function applyPresentersToData (collectionConfig, record, user, headers, callback) {
  if (Array.isArray(record)) {
    const presenterJobs = record.map(record => {
      return righto(presentDataSingle, collectionConfig, record, user, headers);
    });

    return righto.all(presenterJobs)(callback);
  }

  presentDataSingle(collectionConfig, record, user, headers, callback);
}

module.exports = applyPresentersToData;
