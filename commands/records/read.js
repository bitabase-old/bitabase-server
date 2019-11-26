const righto = require('righto');
const sqlite = require('sqlite-fp');
const writeResponse = require('write-response');

const getCollection = require('../../modules/getCollection');
const getUser = require('../../modules/getUser');
const applyPresentersToData = require('../../modules/applyPresentersToData');
const writeResponseError = require('../../modules/writeResponseError');

module.exports = appConfig => function (request, response, params) {
  const username = request.headers.username;
  const password = request.headers.password;

  const collection = righto(getCollection(appConfig), params.databaseName, params.collectionId);

  const dbConnection = righto(sqlite.connect, collection.get('databaseFile'));

  const user = righto(getUser(appConfig), dbConnection, username, password);
  const record = righto(sqlite.getOne, `SELECT * FROM ${params.collectionId} WHERE id = ?`, [params.recordId], dbConnection);
  const closedDatabase = righto(sqlite.close, dbConnection, righto.after(record));

  const presentableRecord = righto(applyPresentersToData, collection.get('config'), record, user, request.headers, righto.after(closedDatabase));

  presentableRecord(function (error, record) {
    if (error) {
      return writeResponseError(error, response);
    }

    writeResponse(200, record, response);
  });
};
