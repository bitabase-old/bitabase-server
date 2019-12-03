const righto = require('righto');
const sqlite = require('sqlite-fp');
const writeResponse = require('write-response');

const { getConnection } = require('../../modules/cachableSqlite');
const getCollection = require('../../modules/getCollection');
const getUser = require('../../modules/getUser');
const applyPresentersToData = require('../../modules/applyPresentersToData');
const handleAndLogError = require('../../modules/handleAndLogError');

module.exports = appConfig => function (request, response, params) {
  const username = request.headers.username;
  const password = request.headers.password;

  const collection = righto(getCollection(appConfig), params.databaseName, params.collectionName);

  const dbConnection = righto(getConnection, collection.get('databaseFile'));

  const user = righto(getUser(appConfig), dbConnection, username, password);

  const recordSql = `SELECT data FROM "_${params.collectionName}" WHERE id = ?`;
  const record = righto(sqlite.getOne, recordSql, [params.recordId], dbConnection);
  const recordData = record.get(record => {
    return record ? JSON.parse(record.data) : righto.fail({
      statusCode: 404, friendly: { error: 'Not Found' }
    });
  });

  const presenterScope = righto.resolve({
    record: recordData,
    user,
    headers: request.headers,
    method: 'read',
    trace: 'records->read->present',
    request: {
      method: request.method,
      databaseName: params.collectionName,
      collectionName: params.collectionName
    }
  });

  const presentableRecord = righto(applyPresentersToData, collection.get('config'), presenterScope);

  presentableRecord(function (error, record) {
    if (error) {
      error.query = recordSql;
      const collection = righto(getCollection(appConfig), params.databaseName, params.collectionName);
      return handleAndLogError(collection, error, response);
    }

    writeResponse(200, record, response);
  });
};
