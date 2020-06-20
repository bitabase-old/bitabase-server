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

  const dbConnection = righto(getConnection, appConfig, collection.get('databaseFile'));

  const user = righto(getUser(appConfig), dbConnection, username, password);

  const recordsSql = queryStringToSql.records(params.collectionName, 'https://localhost' + request.url);
  const records = righto(sqlite.getAll, dbConnection, recordsSql.query, recordsSql.values);

  const recordsData = records.get(records => records.map(record => JSON.parse(record.data)));

  const countSql = queryStringToSql.count(params.collectionName, 'https://localhost' + request.url);
  const totalRecordCount = righto(sqlite.getOne, dbConnection, countSql.query, countSql.values);

  const presenterScope = righto.resolve({
    record: recordsData,
    user,
    headers: request.headers,
    method: 'get',
    trace: 'records->search->present',
    request: {
      method: request.method,
      databaseName: params.collectionName,
      collectionName: params.collectionName
    }
  });
  const presentableRecords = righto(applyPresentersToData, collection.get('config'), presenterScope, righto.after(records));

  const recordsAndCount = righto.mate(presentableRecords, totalRecordCount);

  recordsAndCount(function (error, records, recordCount) {
    if (error) {
      error.query = recordsSql;
      const collection = righto(getCollection(appConfig), params.databaseName, params.collectionName);
      return handleAndLogError(appConfig, collection, error, response);
    }

    writeResponse(200, {
      count: recordCount['count(*)'],
      items: records
    }, response);
  });
};
