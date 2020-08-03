const righto = require('righto');
const sqlite = require('sqlite-fp');
const finalStream = require('final-stream');
const writeResponse = require('write-response');

const { getConnection } = require('../../modules/cachableSqlite');
const getCollection = require('../../modules/getCollection');

const applyPresentersToData = require('../../modules/applyPresentersToData');
const applyTransducersToData = require('../../modules/applyTransducersToData');
const validateDataAgainstSchema = require('../../modules/validateDataAgainstSchema');
const handleAndLogError = require('../../modules/handleAndLogError');

function patchRecordIntoDatabase (collectionName, recordId, data, dbConnection, callback) {
  if (typeof data !== 'object') {
    return callback(new Error({
      statusCode: 500,
      friendly: 'Unexpected Server Error'
    }));
  }

  const sql = `
    UPDATE "_${collectionName}"
    SET data = ?, date_updated = ?
    WHERE id = ?
  `;

  const dataString = JSON.stringify({
    ...data,
    id: recordId
  });

  const preparedValuesWithId = [dataString, Date.now(), recordId];

  const executedQuery = righto(sqlite.run, dbConnection, sql, preparedValuesWithId);

  const result = righto.mate({ ...data, id: recordId }, righto.after(executedQuery));

  result(callback);
}

module.exports = appConfig => function (request, response, params) {
  const data = righto(finalStream, request, JSON.parse);

  const collection = righto(getCollection(appConfig), params.databaseName, params.collectionName);

  const dbConnection = righto(getConnection, appConfig, collection.get('databaseFile'));

  const recordSql = `SELECT data FROM "_${params.collectionName}" WHERE id = ?`;
  const record = righto(sqlite.getOne, dbConnection, recordSql, [params.recordId]);
  const existingData = record
    .get(record => {
      return record ? JSON.parse(record.data) : righto.fail({
        statusCode: 404, friendly: { error: 'Not Found' }
      });
    });
  const recordData = righto.resolve({ data, existingData }).get(({ data, existingData }) => {
    const obj = { ...existingData, ...data };
    delete obj.id;
    return obj;
  });

  const schemaScope = righto.resolve({
    headers: request.headers,
    trace: 'records->patch->schema',
    method: 'patch',
    body: recordData,
    request: {
      method: request.method,
      databaseName: params.collectionName,
      collectionName: params.collectionName
    }
  });
  const validData = righto(validateDataAgainstSchema, appConfig, collection.get('config'), schemaScope);

  const transducerScope = righto.resolve({
    headers: request.headers,
    trace: 'records->patch->transducer',
    body: validData,
    method: 'patch',
    request: {
      method: request.method,
      databaseName: params.collectionName,
      collectionName: params.collectionName
    }
  });
  const transducedData = righto(applyTransducersToData, appConfig, collection.get('config'), transducerScope);

  const insertedRecord = righto(patchRecordIntoDatabase, params.collectionName, params.recordId, transducedData, dbConnection);

  const presenterScope = righto.resolve({
    record: insertedRecord,
    headers: request.headers,
    trace: 'records->update->present',
    method: 'patch',
    request: {
      method: request.method,
      databaseName: params.collectionName,
      collectionName: params.collectionName
    }
  });

  const presentableRecord = righto(applyPresentersToData, appConfig, collection.get('config'), presenterScope);

  presentableRecord(function (error, result) {
    if (error) {
      const collection = righto(getCollection(appConfig), params.databaseName, params.collectionName);
      return handleAndLogError(appConfig, collection, error, response);
    }

    writeResponse(200, result, response);
  });
};
