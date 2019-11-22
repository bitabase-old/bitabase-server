const fs = require('fs');
const path = require('path');
const righto = require('righto');
const mkdirp = require('mkdirp');
const writeResponse = require('write-response');

const writeResponseError = require('../../modules/writeResponseError');

module.exports = config => function (request, response, params) {
  const configFile = path.resolve(config.databasePath, params.databaseName);

  const existingDirectory = righto(mkdirp, configFile);
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
