const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const righto = require('righto');
const sqlite = require('sqlite-fp');
const writeResponse = require('write-response');
const finalStream = require('final-stream');

const validate = require('./validate');
const connectWithCreate = require('../../modules/connectWithCreate');

function getExistingFieldNames (id, dbConnection, callback) {
  sqlite.getAll(`PRAGMA table_info(${id})`, dbConnection, function (error, existingFields) {
    if (error) {
      return callback(error)
    }

    existingFields = existingFields.map(field => field.name);
    callback(null, existingFields);
  })
}

function getConfigFilePath (databasePath, databaseName, collectionId) {
  return path.resolve(databasePath, `${databaseName}/${collectionId}.json`)
}

function cleanDataFromDeletedColumns (existingFields, data, dbConnection, callback) {
  const fieldsToDelete = existingFields
    .filter(field => field !== 'id' && !Object.keys(data.schema).includes(field))
    .map(field => `${field}=''`);

  if (fieldsToDelete.length > 0) {
    return sqlite.run(`UPDATE ${data.id} SET ${fieldsToDelete.join(', ')}`, dbConnection, callback)
  }

  callback()
}

function addNewColumnsToCollection (existingFields, data, dbConnection, callback) {
  const fieldsToAdd = Object.keys(data.schema)
    .filter(field => field !== 'id' && !existingFields.includes(field))
    .map(field => {
      return righto(sqlite.run, `ALTER TABLE ${data.id} ADD ${field} TEXT`, dbConnection);
    });

  righto.all(fieldsToAdd)(function (error, results) {
    if (error) {
      return callback(error)
    }

    callback()
  })
}

module.exports = appConfig => function (request, response, params) {
  const parsedData = righto(finalStream, request, JSON.parse);
  const validData = righto(validate, parsedData).get(data => ({
    ...data,
    id: params.collectionId
  }));

  const configFile = righto.sync(getConfigFilePath, appConfig.databasePath, params.databaseName, validData.get('id'))
  const configFolder = righto.sync(path.dirname, configFile);

  const folderExists = righto(mkdirp, configFolder);
  const existingConfigFile = righto(fs.stat, configFile, righto.after(folderExists));

  const writtenConfigFile = righto(fs.writeFile, configFile, validData.get(JSON.stringify), righto.after(existingConfigFile))

  const result = righto.mate(validData, righto.after(writtenConfigFile))

  result(function (error, validData) {
    const dbFilePath = righto.sync(path.resolve, appConfig.databasePath, params.databaseName, `${validData.id}.db`);
    const dbConnection = righto(connectWithCreate, dbFilePath);

    const existingFields = righto(getExistingFieldNames, validData.id, dbConnection)

    const cleanedColumns = righto(cleanDataFromDeletedColumns, existingFields, validData, dbConnection);
    const insertedColumns = righto(addNewColumnsToCollection, existingFields, validData, dbConnection);

    const closedDatabase = righto(sqlite.close, dbConnection, righto.after(cleanedColumns, insertedColumns))

    closedDatabase(function (error, data) {
      if (error) {
        console.log(error);
        return writeResponse(500, 'Unexpected Server Error', response);  
      }

      writeResponse(200, data, response);
    })
  });
};
