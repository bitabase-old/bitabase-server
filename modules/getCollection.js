const fs = require('fs');
const path = require('path');

const ErrorWithObject = require('error-with-object');

module.exports = config => function (databaseName, collectionName, callback) {
  const notFoundErrorMessage = {
    error: `the collection "${databaseName}/${collectionName}" does not exist`
  };

  if (databaseName.match(/[^a-z0-9-]/gi, '')) {
    return callback(new ErrorWithObject({ statusCode: 404, friendly: notFoundErrorMessage }));
  }

  if (collectionName.match(/[^a-z0-9-]/gi, '')) {
    return callback(new ErrorWithObject({ statusCode: 404, friendly: notFoundErrorMessage }));
  }

  const collectionConfigFile = path.resolve(config.databasePath, `${databaseName}/${collectionName}`);

  fs.readFile(collectionConfigFile + '.json', 'utf8', function (error, collectionConfig) {
    if (error) {
      if (error.code === 'ENOENT') {
        return callback(new ErrorWithObject({ statusCode: 404, friendly: notFoundErrorMessage }));
      }
      return callback(error);
    }

    collectionConfig = JSON.parse(collectionConfig);

    callback(null, {
      config: collectionConfig,
      configFile: collectionConfigFile,
      definitionFile: collectionConfigFile + '.json',
      databaseFile: collectionConfigFile + '.db',
      databaseName,
      collectionName
    });
  });
};
