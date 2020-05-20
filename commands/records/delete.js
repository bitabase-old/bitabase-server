const righto = require('righto');
const sqlite = require('sqlite-fp');
const finalStream = require('final-stream');
const writeResponse = require('write-response');

const { getConnection } = require('../../modules/cachableSqlite');
const getCollection = require('../../modules/getCollection');
const getUser = require('../../modules/getUser');
const applyPresentersToData = require('../../modules/applyPresentersToData');
const applyTransducersToData = require('../../modules/applyTransducersToData');
const validateDataAgainstSchema = require('../../modules/validateDataAgainstSchema');
const handleAndLogError = require('../../modules/handleAndLogError');

const uuidv4 = require('uuid').v4;

function deleteRecordFromDatabase (collectionName, id, dbConnection, callback) {
  if (typeof id !== 'string') {
    return callback({
      statusCode: 500,
      friendly: { error: 'Unexpected Server Error' }
    });
  }

  const sql = `
    DELETE FROM "_${collectionName}"
    WHERE id = ?
  `;

  const preparedValuesWithId = [id];

  const recordSql = `SELECT data FROM "_${collectionName}" WHERE id = ?`;
  const record = righto(sqlite.getOne, recordSql, [id], dbConnection)
  .get(item => item || righto.fail({
      statusCode: 404,
      friendly: { error: 'Not Found' }
  }));

  const executedQuery = righto(sqlite.run, sql, preparedValuesWithId, dbConnection, righto.after(record));

  const result = righto.mate({ id }, righto.after(executedQuery));

  result(callback);
}

module.exports = appConfig => function (request, response, params) {
  const data = righto(finalStream, request, JSON.parse);

  const collection = righto(getCollection(appConfig), params.databaseName, params.collectionName);

  const dbConnection = righto(getConnection, collection.get('databaseFile'));

  const user = righto(getUser(appConfig), dbConnection, request.headers.username, request.headers.password);

  const transducerScope = righto.resolve({
    user,
    headers: request.headers,
    trace: 'records->delete->transducer',
    method: 'delete',
    request: {
      method: request.method,
      databaseName: params.collectionName,
      collectionName: params.collectionName
    }
  });
  const transducedData = righto(applyTransducersToData, collection.get('config'), transducerScope);

  const deletedRecord = righto(deleteRecordFromDatabase,  params.collectionName, params.recordId, dbConnection, righto.after(transducedData));

  deletedRecord(function (error, result) {
    if (error) {
      const collection = righto(getCollection(appConfig), params.databaseName, params.collectionName);
      return handleAndLogError(collection, error, response);
    }

    writeResponse(200, result, response);
  });
};