const righto = require('righto');
const sqlite = require('sqlite-fp');
const writeResponse = require('write-response');

const { getConnection } = require('../../modules/cachableSqlite');
const queryStringToSql = require('../../modules/queryStringToSql');

const getCollection = require('../../modules/getCollection');
const applyPresentersToData = require('../../modules/applyPresentersToData');
const handleAndLogError = require('../../modules/handleAndLogError');

module.exports = appConfig => function (request, response, params) {
  const parsedUrl = (new URL('http://localhost/' + request.url));
  const fields = parsedUrl.searchParams.get('fields');

  const collection = righto(getCollection(appConfig), params.databaseName, params.collectionName);

  const dbConnection = righto(getConnection, appConfig, collection.get('databaseFile'));

  const recordsSql = queryStringToSql.records(params.collectionName, 'https://localhost' + request.url);
  const records = righto(sqlite.getAll, dbConnection, recordsSql.query, recordsSql.values);

  const recordsData = records.get(records => records.map(record => {
    return fields ? record : JSON.parse(record.data);
  }));

  const countSql = queryStringToSql.count(params.collectionName, 'https://localhost' + request.url);
  const totalRecordCount = righto(sqlite.getOne, dbConnection, countSql.query, countSql.values);

  const presenterScope = righto.resolve({
    record: recordsData,
    headers: request.headers,
    method: 'get',
    trace: 'records->search->present',
    request: {
      method: request.method,
      databaseName: params.collectionName,
      collectionName: params.collectionName
    }
  });
  const presentableRecords = righto(applyPresentersToData, appConfig, collection.get('config'), presenterScope, righto.after(records));

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
