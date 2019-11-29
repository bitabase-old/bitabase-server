const fs = require('fs');
const path = require('path');

const mkdirp = require('mkdirp');
const righto = require('righto');
const sqlite = require('sqlite-fp');
const finalStream = require('final-stream');
const writeResponse = require('write-response');
const ErrorWithObject = require('error-with-object');

const validate = require('./validate');
const connectWithCreate = require('../../modules/connectWithCreate');
const writeResponseError = require('../../modules/writeResponseError');

function createTableFromSchema (collectionName, connection, callback) {
  sqlite.run(
    `CREATE TABLE "_${collectionName}" (
      id VARCHAR (36) PRIMARY KEY NOT NULL UNIQUE,
      data TEXT,
      date_created NUMBER
    )`,
    connection, callback
  );
}

function createCollectionDatabase (databasePath, databaseName, collectionConfig, callback) {
  const collectionName = collectionConfig.name;
  const filePath = path.resolve(databasePath, `${databaseName}/${collectionName}.db`);

  const dbConnection = righto(connectWithCreate, filePath);
  const createdTable = righto(createTableFromSchema, collectionName, dbConnection);
  const closedDatabase = righto(sqlite.close, dbConnection, righto.after(createdTable));

  closedDatabase(function (error) {
    if (error) {
      return callback(error);
    }

    callback(null, { ...collectionConfig });
  });
}

function createConfigFile (databasePath, databaseName, collectionConfig, callback) {
  const configFile = path.resolve(databasePath, `${databaseName}/${collectionConfig.name}.json`);
  const configFolder = path.dirname(configFile);

  const folderExists = righto(mkdirp, configFolder);
  const existingConfigFile = righto(fs.stat, configFile, righto.after(folderExists));

  existingConfigFile(function (error, existingConfig) {
    if (error && error.code === 'ENOENT') {
      return fs.writeFile(configFile, JSON.stringify(collectionConfig), callback);
    }

    callback(new ErrorWithObject({
      statusCode: 422,
      message: { name: 'already taken' }
    }));
  });
}

module.exports = config => function (request, response, params) {
  const parsedData = righto(finalStream, request, JSON.parse);
  const validData = righto(validate, parsedData);

  const configFileCreated = righto(createConfigFile,
    config.databasePath, params.databaseName, validData);

  const createdCollection = righto(createCollectionDatabase,
    config.databasePath, params.databaseName, validData, righto.after(configFileCreated));

  createdCollection(function (error, result) {
    if (error) {
      return writeResponseError(error, response);
    }

    writeResponse(201, result, response);
  });
};
