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

function getExistingFieldNames (dbConnection, id, callback) {
  console.log(123)
  db.getAll(`PRAGMA table_info(${id})`, function (error, existingFields) {
    if (error) {
      return callback(error)
    }

    existingFields.map(field => field.name);
    callback(null, existingFields);
  })
}

function getConfigFilePath (databasePath, databaseName, collectionId) {
  return path.resolve(databasePath, `${databaseName}/${collectionId}.json`)
}

function cleanDataFromDeletedColumns (dbConnection, existingFields, validData, schema, callback) {
  const fieldsToDelete = existingFields
    .filter(field => field !== 'id' && !Object.keys(data.schema).includes(field))
    .map(field => `${field}=''`);

  if (fieldsToDelete.length > 0) {
    return sqlite.run(`UPDATE ${data.id} SET ${fieldsToDelete.join(', ')}`, callback)
  }

  callback()
}

function addNewColumnsToCollection (existingFields, validData, schema, dbConnection, callback) {
    const fieldsToAdd = Object.keys(data.schema)
      .filter(field => field !== 'id' && !existingFields.includes(field))
      .map(field => {
        return sqlite.run(`ALTER TABLE ${data.id} ADD ${field} TEXT`, dbConnection );
      });

  if (fieldsToDelete.length > 0) {
    return sqlite.run(`UPDATE ${data.id} SET ${fieldsToDelete.join(', ')}`, callback)
  }

  callback()
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
    console.log({validData})
    const dbFilePath = righto.sync(path.resolve, appConfig.databasePath, params.databaseName, `${validData.id}.db`);
    const dbConnection = righto(connectWithCreate, dbFilePath);

    const existingFields = righto(getExistingFieldNames, validData.id, dbConnection)

    const cleanedColumns = righto(cleanDataFromDeletedColumns, existingFields, validData.get('schema'), dbConnection)
    const insertedColumns = righto(addNewColumnsToCollection, existingFields, validData.get('schema'), dbConnection)

    const closedDatabase = righto(sqlite.close, dbConnection, righto.after(cleanedColumns, insertedColumns))

    closedDatabase(function (error, data) {
      console.log(1)
      if (error) {
        console.log(error);
        return writeResponse(500, 'Unexpected Server Error', response);  
      }

      writeResponse(200, data, response);
    })
  });
};
