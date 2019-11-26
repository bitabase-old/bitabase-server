const righto = require('righto');
const sqlite = require('sqlite-fp');
const ErrorWithObject = require('error-with-object');
const finalStream = require('final-stream');
const writeResponse = require('write-response');

const connectWithCreate = require('../../modules/connectWithCreate');
const getCollection = require('../../modules/getCollection');
const getUser = require('../../modules/getUser');
const applyPresentersToData = require('../../modules/applyPresentersToData');
const applyMutationsToData = require('../../modules/applyMutationsToData');
const evaluate = require('../../modules/evaluate');
const writeResponseError = require('../../modules/writeResponseError');

const uuidv4 = require('uuid').v4;

function checkFieldValidation (schema, field, data, user, callback) {
  const fieldValidations = schema[field].map(checkFn => {
    if (checkFn === 'required') {
      return;
    }

    if (checkFn === 'string') {
      checkFn = 'getType(value) == "string" ? null : "must be string"';
    }

    if (checkFn === 'array') {
      checkFn = 'getType(value) == "Array" ? null : "must be array"';
    }

    return righto(evaluate, checkFn, {
      value: data[field],
      user
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

function checkSchemaValidations (schema, data, user, errors, callback) {
  const schemaValidations = Object.keys(data)
    .map(field => {
      return righto(checkFieldValidation, schema, field, data, user);
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

function checkSchemaRules (rules, data, user, callback) {
  if (!rules || !rules.POST) {
    return callback();
  }

  const ruleChecks = rules.POST.map(rule => {
    return righto(evaluate, rule, { data, user });
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

function validateDataAgainstSchema (collectionConfig, data, user, callback) {
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

  const schemaValidated = righto(checkSchemaValidations, schema, data, user, errors);

  const result = righto.mate(data, righto.after(schemaValidated));

  result(callback);
}

function insertRecordIntoDatabase (collectionId, data, dbConnection, callback) {
  const id = uuidv4();

  const sql = `
    INSERT INTO ${collectionId} 
    (id, ${Object.entries(data).map(o => o[0]).join(', ')}) 
    VALUES 
    (?, ${Object.keys(data).fill('?').join(', ')})
  `;

  const values = [id, ...Object.entries(data)
    .map(o => o[1])]
    .map(value => Array.isArray(value) ? JSON.stringify(value) : value);

  const executedQuery = righto(sqlite.run, sql, values, dbConnection);
  const closeDbConnection = righto(sqlite.close, dbConnection, righto.after(executedQuery));

  closeDbConnection(function (error, result) {
    if (error) {
      return callback(error);
    }
    callback(null, { ...data, id });
  });
}

module.exports = appConfig => function (request, response, params) {
  const data = righto(finalStream, request, JSON.parse);

  const account = params.databaseName;

  const collection = righto(getCollection(appConfig), account, params.collectionId);

  const dbConnection = righto(connectWithCreate, collection.get('databaseFile'));

  const user = righto(getUser(appConfig), dbConnection, request.headers.username, request.headers.password);

  const rulesPassed = righto(checkSchemaRules, collection.get('config').get('rules'), data, user);
  const mutatedData = righto(applyMutationsToData, collection.get('config'), data, user, righto.after(rulesPassed));
  const validData = righto(validateDataAgainstSchema, collection.get('config'), mutatedData, user);

  const insertedRecord = righto(insertRecordIntoDatabase, params.collectionId, validData, dbConnection);

  const presentableRecord = righto(applyPresentersToData, collection.get('config'), insertedRecord, user);

  presentableRecord(function (error, result) {
    if (error) {
      return writeResponseError(error, response);
    }

    writeResponse(201, result, response);
  });
};
