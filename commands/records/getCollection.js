const fs = require('fs');
const path = require('path');

const ErrorWithObject = require('error-with-object');

module.exports = config => function (account, collectionId, callback) {
  const notFoundErrorMessage = {
    error: `the collection "${account}/${collectionId}" does not exist`
  };

  if (account.match(/[^a-z0-9]/gi, '')) {
    return callback(ErrorWithObject({ code: 404, message: notFoundErrorMessage }));
  }

  if (collectionId.match(/[^a-z0-9]/gi, '')) {
    return callback(ErrorWithObject({ code: 404, message: notFoundErrorMessage }));
  }

  const collectionConfigFile = path.resolve(config.databasePath, `${account}/${collectionId}`);

  fs.readFile(collectionConfigFile + '.json', 'utf8', function (error, collectionConfig) {
    if (error) {
      if (error.code === 'ENOENT') {
        return callback(ErrorWithObject({ code: 404, message: notFoundErrorMessage }));
      }
      return callback(error);
    }

    collectionConfig = JSON.parse(collectionConfig);

    callback(null, {
      config: collectionConfig,
      configFile: collectionConfigFile,
      definitionFile: collectionConfigFile + '.json',
      databaseFile: collectionConfigFile + '.db',
      account,
      collectionId
    });
  });
};
