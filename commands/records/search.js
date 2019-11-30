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

  const collection = righto(getCollection(appConfig), params.databaseName, params.collectionId);

  const dbConnection = righto(getConnection, collection.get('databaseFile'));

  const user = righto(getUser(appConfig), dbConnection, username, password);

  const recordsSql = queryStringToSql.records(params.collectionId, 'https://localhost' + request.url);
  const records = righto(sqlite.getAll, recordsSql.query, recordsSql.values, dbConnection);

  const recordsData = records.get(records => records.map(record => JSON.parse(record.data)));

  const countSql = queryStringToSql.count(params.collectionId, 'https://localhost' + request.url);
  const totalRecordCount = righto(sqlite.getOne, countSql.query, countSql.values, dbConnection);

  const presenterScope = righto.resolve({
    record: recordsData,
    user,
    headers: request.headers,
    method: 'get'
  });
  const presentableRecords = righto(applyPresentersToData, collection.get('config'), presenterScope, righto.after(records));

  const recordsAndCount = righto.mate(presentableRecords, totalRecordCount);

  recordsAndCount(function (error, records, recordCount) {
    if (error) {
      const collection = righto(getCollection(appConfig), params.databaseName, params.collectionId);
      return handleAndLogError(collection, error, response);
    }

    writeResponse(200, {
      count: recordCount['count(*)'],
      items: records
    }, response);
  });
};
