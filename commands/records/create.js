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

function insertRecordIntoDatabase (collectionName, data, dbConnection, callback) {
  if (typeof data !== 'object') {
    return callback(new Error({
      statusCode: 500,
      friendly: 'Unexpected Server Error'
    }));
  }

  const id = uuidv4();

  const sql = `
    INSERT INTO "_${collectionName}"
    (id, data, date_created)
    VALUES 
    (?, ?, ?)
  `;

  const dataString = JSON.stringify({
    ...data,
    id
  });

  const preparedValuesWithId = [id, dataString, Date.now()];

  const executedQuery = righto(sqlite.run, sql, preparedValuesWithId, dbConnection);

  const result = righto.mate({ ...data, id }, righto.after(executedQuery));

  result(callback);
}

module.exports = appConfig => function (request, response, params) {
  const data = righto(finalStream, request, JSON.parse);

  const collection = righto(getCollection(appConfig), params.databaseName, params.collectionName);

  const dbConnection = righto(getConnection, collection.get('databaseFile'));

  const user = righto(getUser(appConfig), dbConnection, request.headers.username, request.headers.password);

  const schemaScope = righto.resolve({
    user,
    headers: request.headers,
    trace: 'records->create->schema',
    method: 'post',
    body: data,
    request: {
      method: request.method,
      databaseName: params.collectionName,
      collectionName: params.collectionName
    }
  });
  const validData = righto(validateDataAgainstSchema, collection.get('config'), schemaScope);

  const transducerScope = righto.resolve({
    user,
    headers: request.headers,
    trace: 'records->create->transducer',
    body: validData,
    method: 'post',
    request: {
      method: request.method,
      databaseName: params.collectionName,
      collectionName: params.collectionName
    }
  });
  const transducedData = righto(applyTransducersToData, collection.get('config'), transducerScope);

  const insertedRecord = righto(insertRecordIntoDatabase, params.collectionName, transducedData, dbConnection);

  const presenterScope = righto.resolve({
    record: insertedRecord,
    user,
    headers: request.headers,
    trace: 'records->create->present',
    method: 'post',
    request: {
      method: request.method,
      databaseName: params.collectionName,
      collectionName: params.collectionName
    }
  });

  const presentableRecord = righto(applyPresentersToData, collection.get('config'), presenterScope);

  presentableRecord(function (error, result) {
    if (error) {
      const collection = righto(getCollection(appConfig), params.databaseName, params.collectionName);
      return handleAndLogError(collection, error, response);
    }

    writeResponse(201, result, response);
  });
};
