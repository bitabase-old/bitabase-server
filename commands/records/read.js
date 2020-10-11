const righto = require('righto');
const sqlite = require('sqlite-fp');
const writeResponse = require('write-response');

const { getConnection } = require('../../modules/cachableSqlite');
const getCollection = require('../../modules/getCollection');

const applyPresentersToData = require('../../modules/applyPresentersToData');
const handleAndLogError = require('../../modules/handleAndLogError');

module.exports = appConfig => function (request, response, params) {
  const collection = righto(getCollection(appConfig), params.databaseName, params.collectionName);

  const dbConnection = righto(getConnection, appConfig, collection.get('databaseFile'));

  const recordSql = `SELECT data FROM "_${params.collectionName}" WHERE id = ?`;
  const record = righto(sqlite.getOne, dbConnection, recordSql, [params.recordId]);
  const recordData = record.get(record => {
    return record ? JSON.parse(record.data) : righto.fail({
      statusCode: 404, friendly: { error: 'Not Found' }
    });
  });

  const presenterScope = righto.resolve({
    record: recordData,
    headers: request.headers,
    method: 'read',
    trace: 'records->read->present',
    request: {
      method: request.method,
      databaseName: params.collectionName,
      collectionName: params.collectionName
    }
  });

  const presentableRecord = righto(applyPresentersToData, appConfig, collection.get('config'), presenterScope);

  presentableRecord(function (error, record) {
    if (error) {
      error.query = recordSql;
      const collection = righto(getCollection(appConfig), params.databaseName, params.collectionName);
      return handleAndLogError(appConfig, collection, error, response);
    }

    writeResponse(200, record, response);
  });
};
