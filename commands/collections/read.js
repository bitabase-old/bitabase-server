const fs = require('fs');
const path = require('path');
const righto = require('righto');
const mkdirp = require('mkdirp');
const writeResponse = require('write-response');

module.exports = config => function (request, response, params) {
  const collectionConfigPath = path.resolve(config.databasePath, params.databaseName || '_', `${params.collectionId || '_'}.json`);
  console.log(collectionConfigPath)
  fs.readFile(collectionConfigPath, 'utf8', function (error, collectionConfig) {
    if (error) {
      if (error.code === 'ENOENT') {
        return writeResponse(404, 'Not Found', response);
      }
      console.log(error);
      return writeResponse(500, 'Unexpected Server Error', response);
    }

    writeResponse(200, collectionConfig, response);
  });
};
