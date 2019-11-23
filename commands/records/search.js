const righto = require('righto');
const sqlite = require('sqlite-fp');
const writeResponse = require('write-response');

const writeResponseError = require('../../modules/writeResponseError');
const queryStringToSql = require('../../modules/queryStringToSql');
const getUser = require('../../modules/getUser');
const getCollection = require('../../modules/getCollection');
const applyPresentersToData = require('../../modules/applyPresentersToData');

module.exports = appConfig => function (request, response, params) {
  const username = request.headers.username;
  const password = request.headers.password;

  const collection = righto(getCollection(appConfig), params.databaseName, params.collectionId);

  const dbConnection = righto(sqlite.connect, collection.get('databaseFile'));

  const user = righto(getUser(appConfig), dbConnection, username, password);

  const recordsSql = queryStringToSql.records(params.collectionId, 'https://localhost' + request.url);
  const records = righto(sqlite.getAll, recordsSql.query, recordsSql.values, dbConnection);

  const countSql = queryStringToSql.count(params.collectionId, 'https://localhost' + request.url);
  const totalRecordCount = righto(sqlite.getOne, countSql.query, countSql.values, dbConnection);

  const closedDatabase = righto(sqlite.close, dbConnection, righto.after(records));

  const presentableRecords = righto(applyPresentersToData, collection.get('config'), records, user, righto.after(closedDatabase));

  const recordsAndCount = righto.mate(presentableRecords, totalRecordCount);

  recordsAndCount(function (error, records, recordCount) {
    if (error) {
      if (error.code === 'SQLITE_ERROR' && error.message.includes('no such column')) {
        let fieldName = error.toString().split(' ');
        fieldName = fieldName[fieldName.length - 1];
        fieldName = fieldName.replace(params.collectionId + '.', '');
        return writeResponse(400, { error: `query filter on none existing field [${fieldName}]` }, response);
      }
      return writeResponseError(error, response);
    }

    writeResponse(200, {
      count: recordCount['count(*)'],
      items: records
    }, response);
  });
};
