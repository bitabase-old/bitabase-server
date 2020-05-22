const fs = require('fs');
const path = require('path');
const righto = require('righto');
const writeResponse = require('write-response');

const writeResponseError = require('../../modules/writeResponseError');

module.exports = config => function (request, response, params) {
  if (params.databaseName.match(/[^a-z0-9-]/gi, '')) {
    writeResponse(404, 'Not Found', response);
  }

  const configFile = path.resolve(config.databasePath, params.databaseName);

  const existingDirectory = righto(fs.mkdir, configFile, { recursive: true });
  const collectionConfigData = righto(fs.readdir, configFile, righto.after(existingDirectory));

  collectionConfigData(function (error, collections) {
    if (error) {
      return writeResponseError(error, response);
    }
    collections = collections
      .filter(item => item.endsWith('.db'))
      .map(item => item.replace(/\.db$/, ''));

    writeResponse(200, {
      count: collections.length,
      items: collections
    }, response);
  });
};
