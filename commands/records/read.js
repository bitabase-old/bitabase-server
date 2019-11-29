const righto = require('righto');
const sqlite = require('sqlite-fp');
const writeResponse = require('write-response');

const { getConnection } = require('../../modules/cachableSqlite');
const getCollection = require('../../modules/getCollection');
const getUser = require('../../modules/getUser');
const applyPresentersToData = require('../../modules/applyPresentersToData');
const writeResponseError = require('../../modules/writeResponseError');

module.exports = appConfig => function (request, response, params) {
  const username = request.headers.username;
  const password = request.headers.password;

  const collection = righto(getCollection(appConfig), params.databaseName, params.collectionId);

  const dbConnection = righto(getConnection, collection.get('databaseFile'));

  const user = righto(getUser(appConfig), dbConnection, username, password);
  const record = righto(sqlite.getOne, `SELECT data FROM "_${params.collectionId}" WHERE id = ?`, [params.recordId], dbConnection);
  const recordData = record.get(record => {
    return record ? JSON.parse(record.data) : righto.fail({
      statusCode: 404, friendly: 'Not Found'
    });
  });

  const presenterScope = righto.resolve({
    record: recordData,
    user,
    headers: request.headers,
    method: 'read'
  });

  const presentableRecord = righto(applyPresentersToData, collection.get('config'), presenterScope);

  presentableRecord(function (error, record) {
    if (error) {
      return writeResponseError(error, response);
    }

    writeResponse(200, record, response);
  });
};
