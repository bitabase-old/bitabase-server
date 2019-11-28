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

function checkFieldValidation (schema, field, data, user, headers, callback) {
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
      value: data[field],
      user,
      headers
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

function checkSchemaValidations (schema, data, user, headers, errors, callback) {
  const schemaValidations = Object.keys(data)
    .map(field => {
      return righto(checkFieldValidation, schema, field, data, user, headers);
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

function checkSchemaRules (rules, data, user, headers, callback) {
  if (!rules || !rules.POST) {
    return callback();
  }

  const ruleChecks = rules.POST.map(rule => {
    return righto(evaluate, rule, { data, user, headers });
  });

  righto.all(ruleChecks)(function (error, fieldResults) {
    if (error) { return callback(error); }

    const errors = fieldResults.filter(result => result !== '');

    if (errors.length > 0) {
      return callback(new ErrorWithObject({
        statusCode: 400,
        friendly: errors
      }));
    }

    callback();
  });
}

function validateDataAgainstSchema (collectionConfig, data, user, headers, callback) {
  const { schema } = collectionConfig;

  if (!schema || schema.length === 0) {
    return callback(new ErrorWithObject({
      statusCode: 400,
      friendly: 'collection has no fields so you can not post'
    }));
  }

  const errors = {};

  // TODO: Abstract checkForRequiredFields()
  Object.keys(schema).forEach(field => {
    if (schema[field].includes('required') && !data[field]) {
      errors[field] = errors[field] || [];
      errors[field].push('required');
    }
  });

  // TODO: Abstract checkForUnknownFields()
  Object.keys(data).map(field => {
    if (!schema[field]) {
      errors[field] = errors[field] || [];
      errors[field].push('unknown field');
    }
  });

  const schemaValidated = righto(checkSchemaValidations, schema, data, user, headers, errors);
  const result = righto.mate(data, righto.after(schemaValidated));

  result(callback);
}

function insertRecordIntoDatabase (collectionId, data, dbConnection, callback) {
  const id = uuidv4();

  const sql = `
    INSERT INTO ${collectionId} 
    (id, ${Object.keys(data).join(', ')})
    VALUES 
    (?, ${Object.keys(data).fill('?').join(', ')})
  `;

  const preparedValues = Object.values(data)
    .map(value => Array.isArray(value) ? JSON.stringify(value) : value);

  const preparedValuesWithId = [id, ...preparedValues];

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

  const rulesPassed = righto(checkSchemaRules, collection.get('config').get('rules'), data, user, request.headers);
  const transformedData = righto(applyTransducersToData, collection.get('config'), data, user, request.headers, righto.after(rulesPassed));
  const validData = righto(validateDataAgainstSchema, collection.get('config'), transformedData, user, request.headers);

  const insertedRecord = righto(insertRecordIntoDatabase, params.collectionId, validData, dbConnection);

  const presentableRecord = righto(applyPresentersToData, collection.get('config'), insertedRecord, user, request.headers);

  presentableRecord(function (error, result) {
    if (error) {
      return writeResponseError(error, response);
    }

    writeResponse(201, result, response);
  });
};
