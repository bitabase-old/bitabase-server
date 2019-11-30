const fs = require('fs');
const righto = require('righto');
const writeResponse = require('write-response');
const finalStream = require('final-stream');

const validate = require('./validate');
const writeResponseError = require('../../modules/writeResponseError');
const getCollection = require('../../modules/getCollection');

function updateConfigFile (collection, data, callback) {
  const writtenConfigFile = righto(
    fs.writeFile, collection.definitionFile, JSON.stringify(data)
  );

  writtenConfigFile(callback);
}

module.exports = appConfig => function (request, response, params) {
  const parsedData = righto(finalStream, request, JSON.parse);
  const data = righto(validate, parsedData).get(data => ({
    ...data,
    id: params.collectionName
  }));

  const collection = righto(getCollection(appConfig), params.databaseName, params.collectionName);
  const updatedConfigFile = righto(updateConfigFile, collection, data);

  const result = righto.mate(data, righto.after(updatedConfigFile));

  result(function (error, data) {
    if (error) {
      return writeResponseError(error, response);
    }

    writeResponse(200, data, response);
  });
};
