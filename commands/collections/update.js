const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const righto = require('righto');
const sqlite = require('sqlite-fp');
const writeResponse = require('write-response');
const finalStream = require('final-stream');

const validate = require('./validate');
const connectWithCreate = require('../../modules/connectWithCreate');
const writeResponseError = require('../../modules/writeResponseError');
const getCollection = require('../records/getCollection');

function getExistingFieldNames (id, dbConnection, callback) {
  sqlite.getAll(`PRAGMA table_info(${id})`, dbConnection, function (error, existingFields) {
    if (error) {
      return callback(error);
    }

    existingFields = existingFields.map(field => field.name);
    callback(null, existingFields);
  });
}

function getConfigFilePath (databasePath, databaseName, collectionId) {
  return path.resolve(databasePath, `${databaseName}/${collectionId}.json`);
}

function cleanDataFromDeletedColumns (existingFields, data, dbConnection, callback) {
  const fieldsToDelete = existingFields
    .filter(field => field !== 'id' && !Object.keys(data.schema).includes(field))
    .map(field => `${field}=''`);

  if (fieldsToDelete.length > 0) {
    return sqlite.run(`UPDATE ${data.id} SET ${fieldsToDelete.join(', ')}`, dbConnection, callback);
  }

  callback();
}

function addNewColumnsToCollection (existingFields, data, dbConnection, callback) {
  const fieldsToAdd = Object.keys(data.schema)
    .filter(field => field !== 'id' && !existingFields.includes(field))
    .map(field => {
      return righto(sqlite.run, `ALTER TABLE ${data.id} ADD ${field} TEXT`, dbConnection);
    });

  righto.all(fieldsToAdd)(callback);
}

function updateConfigFile (collection, data, callback) {
  const writtenConfigFile = righto(
    fs.writeFile, collection.definitionFile, JSON.stringify(data)
  );

  writtenConfigFile(callback);
}

function syncTableFields (data, dbConnection, callback) {
  const existingFields = righto(getExistingFieldNames, data.id, dbConnection);
  const cleanedColumns = righto(cleanDataFromDeletedColumns, existingFields, data, dbConnection);
  const insertedColumns = righto(addNewColumnsToCollection, existingFields, data, dbConnection);

  righto.mate(insertedColumns, cleanedColumns)(callback);
}

module.exports = appConfig => function (request, response, params) {
  const parsedData = righto(finalStream, request, JSON.parse);
  const data = righto(validate, parsedData).get(data => ({
    ...data,
    id: params.collectionId
  }));

  const collection = righto(getCollection(appConfig), params.databaseName, params.collectionId)
  const updatedConfigFile = righto(updateConfigFile, collection, data);

  const dbConnection = righto(connectWithCreate, collection.get('databaseFile'), righto.after(updatedConfigFile));

  const syncedTableFields = righto(syncTableFields, data, dbConnection);
  const closedDatabase = righto(sqlite.close, dbConnection, righto.after(syncedTableFields));

  closedDatabase(function (error, data) {
    if (error) {
      return writeResponseError(error, response);
    }

    writeResponse(200, data, response);
  });
};
