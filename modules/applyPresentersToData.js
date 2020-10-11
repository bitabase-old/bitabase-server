const righto = require('righto');
const evaluate = require('./evaluate');

function transformArraysProperty (schema, record) {
  if (!schema) {
    return record;
  }

  const schemaWithId = {
    ...schema,
    id: ['string']
  };

  return Object.keys(schemaWithId)
    .reduce((newRecord, currentProperty) => {
      const fieldIsArray = schemaWithId[currentProperty].includes('array');
      const fieldIsString = typeof record[currentProperty] === 'string';
      const fieldIsNumber = schemaWithId[currentProperty].includes('number');

      if (fieldIsArray && fieldIsString) {
        newRecord[currentProperty] = JSON.parse(record[currentProperty]);
      } else if (fieldIsNumber) {
        newRecord[currentProperty] = Number(record[currentProperty]);
      } else {
        newRecord[currentProperty] = record[currentProperty];
      }

      return newRecord;
    }, {});
}

function presentDataSingle (appConfig, collectionConfig, scope, record, callback) {
  const { presenters } = collectionConfig;

  const presenterFunctions = (presenters || [])
    .map(presenter => {
      return righto(evaluate, appConfig, presenter, {
        ...scope,
        record
      });
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

function applyPresentersToData (appConfig, collectionConfig, scope, callback) {
  if (Array.isArray(scope.record)) {
    const presenterJobs = scope.record.map(record => {
      return righto(presentDataSingle, appConfig, collectionConfig, scope, record);
    });

    return righto.all(presenterJobs)(callback);
  }

  presentDataSingle(appConfig, collectionConfig, scope, scope.record, callback);
}

module.exports = applyPresentersToData;
