const righto = require('righto');
const sqlite = require('sqlite-fp');
const writeResponse = require('write-response');

const { getConnection } = require('../../modules/cachableSqlite');
const queryStringToSql = require('../../modules/queryStringToSql');
const getUser = require('../../modules/getUser');
const getCollection = require('../../modules/getCollection');
const applyPresentersToData = require('../../modules/applyPresentersToData');
const handleAndLogError = require('../../modules/handleAndLogError');

module.exports = appConfig => function (request, response, params) {
  const username = request.headers.username;
  const password = request.headers.password;

  const collection = righto(getCollection(appConfig), params.databaseName, params.collectionName);

  const dbConnection = righto(getConnection, collection.get('databaseFile'));

  const user = righto(getUser(appConfig), dbConnection, username, password);

  const countSql = queryStringToSql.count(params.collectionName, 'https://localhost' + request.url);
  const totalRecordCount = righto(sqlite.getOne, countSql.query, countSql.values, dbConnection);

  const recordsSql = queryStringToSql.records(params.collectionName, 'https://localhost' + request.url, 'delete');
  const deleted = righto(sqlite.run, recordsSql.query, recordsSql.values, dbConnection, righto.after(totalRecordCount));

  const result = righto.mate(totalRecordCount, righto.after(deleted));

  result(function (error, recordCount) {
    if (error) {
      error.query = recordsSql;
      const collection = righto(getCollection(appConfig), params.databaseName, params.collectionName);
      return handleAndLogError(collection, error, response);
    }

    writeResponse(200, {
      count: recordCount['count(*)'],
    }, response);
  });
};
