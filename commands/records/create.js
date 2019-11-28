const righto = require('righto');
const sqlite = require('sqlite-fp');
const ErrorWithObject = require('error-with-object');
const finalStream = require('final-stream');
const writeResponse = require('write-response');

const connectWithCreate = require('../../modules/connectWithCreate');
const getCollection = require('../../modules/getCollection');
const getUser = require('../../modules/getUser');
const applyPresentersToData = require('../../modules/applyPresentersToData');
const applyTransducersToData = require('../../modules/applyTransducersToData');
const evaluate = require('../../modules/evaluate');
const writeResponseError = require('../../modules/writeResponseError');

const uuidv4 = require('uuid').v4;

function checkFieldValidation (schema, field, scope, callback) {
  if (!schema[field]) {
    return callback(null, { [field]: 'unknown column' });
  }

  const fieldValidations = schema[field].map(checkFn => {
    if (checkFn === 'required') {
      return;
    }

    if (checkFn === 'string') {
      checkFn = 'value == null || getType(value) == "string" ? null : "must be string"';
    }

    if (checkFn === 'number') {
      checkFn = 'value == null || getType(value) == "number" ? null : "must be number"';
    }

    if (checkFn === 'array') {
      checkFn = 'value == null || getType(value) == "Array" ? null : "must be array"';
    }

    return righto(evaluate, checkFn, {
      ...scope,
      field,
      value: scope.body[field]
    });
  });

  righto.all(fieldValidations)(function (error, fieldResult) {
    if (error) { return callback(error); }

    const errors = fieldResult.reduce((accumulator, invalid) => {
      if (invalid) {
        accumulator[field] = accumulator[field] || [];
        accumulator[field].push(invalid);
      }
      return accumulator;
    }, {});

    callback(null, errors);
  });
}

function checkSchemaValidations (schema, scope, errors, callback) {
  if (!schema) {
    return callback();
  }

  const schemaValidations = Object.keys(scope.body)
    .map(field => {
      return righto(checkFieldValidation, schema, field, scope);
    });

  righto.all(schemaValidations)(function (error, results) {
    if (error) { return callback(error); }

    results.forEach(validationError => {
      errors = Object.assign(errors, validationError);
    });

    if (Object.keys(errors).length > 0) {
      return callback(new ErrorWithObject({
        statusCode: 400,
        friendly: errors
      }));
    }
    callback();
  });
}

function validateDataAgainstSchema (collectionConfig, scope, callback) {
  const { schema } = collectionConfig;

  if (!schema || schema.length === 0) {
    return callback(new ErrorWithObject({
      statusCode: 400,
      friendly: 'collection has no fields so you can not post'
    }));
  }

  const errors = {};

  if (schema) {
    // TODO: Abstract checkForRequiredFields()
    Object.keys(schema).forEach(field => {
      if (schema[field].includes('required') && !scope.body[field]) {
        errors[field] = errors[field] || [];
        errors[field].push('required');
      }
    });

    // TODO: Abstract checkForUnknownFields()
    Object.keys(scope.body).map(field => {
      if (!schema[field]) {
        errors[field] = errors[field] || [];
        errors[field].push('unknown field');
      }
    });
  }

  const schemaValidated = righto(checkSchemaValidations, schema, scope, errors);
  const result = righto.mate(scope.body, righto.after(schemaValidated));

  result(callback);
}

function insertRecordIntoDatabase (collectionId, data, dbConnection, callback) {
  if (typeof data !== 'object') {
    return callback(new Error({
      statusCode: 500,
      friendly: 'Unexpected Server Error'
    }));
  }

  const id = uuidv4();

  const sql = `
    INSERT INTO "_${collectionId}"
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
  const closeDbConnection = righto(sqlite.close, dbConnection, righto.after(executedQuery));

  const result = righto.mate({ ...data, id }, righto.after(closeDbConnection));

  result(callback);
}

module.exports = appConfig => function (request, response, params) {
  const data = righto(finalStream, request, JSON.parse);

  const account = params.databaseName;

  const collection = righto(getCollection(appConfig), account, params.collectionId);

  const dbConnection = righto(connectWithCreate, collection.get('databaseFile'));

  const user = righto(getUser(appConfig), dbConnection, request.headers.username, request.headers.password);

  const schemaScope = righto.resolve({
    user,
    headers: request.headers,
    body: data,
    method: 'post'
  });
  const validData = righto(validateDataAgainstSchema, collection.get('config'), schemaScope);

  const transducerScope = righto.resolve({
    user,
    headers: request.headers,
    body: validData,
    method: 'post'
  });
  const transducedData = righto(applyTransducersToData, collection.get('config'), transducerScope);

  const insertedRecord = righto(insertRecordIntoDatabase, params.collectionId, transducedData, dbConnection);

  const presenterScope = righto.resolve({
    record: insertedRecord,
    user,
    headers: request.headers,
    method: 'post'
  });

  const presentableRecord = righto(applyPresentersToData, collection.get('config'), presenterScope);

  presentableRecord(function (error, result) {
    if (error) {
      return writeResponseError(error, response);
    }

    writeResponse(201, result, response);
  });
};
