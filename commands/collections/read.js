const fs = require('fs');
const righto = require('righto');
const writeResponse = require('write-response');

const writeResponseError = require('../../modules/writeResponseError');
const getCollection = require('../../modules/getCollection');

module.exports = config => function (request, response, params) {
  const collection = righto(getCollection(config), params.databaseName, params.collectionId);
  const collectionDefinitionData = righto(fs.readFile, collection.get(c => c.definitionFile), 'utf8');

  collectionDefinitionData(function (error, collectionConfig) {
    if (error) {
      return writeResponseError(error, response);
    }

    writeResponse(200, collectionConfig, response);
  });
};
