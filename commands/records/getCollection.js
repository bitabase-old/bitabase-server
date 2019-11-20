const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const access = promisify(fs.access);
const readFile = promisify(fs.readFile);

const ErrorWithObject = require('error-with-object');

module.exports = config => async function (account, collectionId) {
  if (account.match(/[^a-z0-9]/gi, '')) {
    console.log('Invalid database name');
    throw ErrorWithObject({ code: 404 });
  }

  if (collectionId.match(/[^a-z0-9]/gi, '')) {
    console.log('Invalid collection ID');
    throw ErrorWithObject({ code: 404 });
  }

  const collectionConfigFile = path.resolve(config.databasePath, `${account}/${collectionId}`);
  try {
    await access(collectionConfigFile + '.json', fs.constants.F_OK);
  } catch (error) {
    throw new ErrorWithObject({ code: 404, error });
  }

  let collectionConfig = await readFile(collectionConfigFile + '.json', 'utf8');
  collectionConfig = JSON.parse(collectionConfig);

  return {
    config: collectionConfig,
    configFile: collectionConfigFile,
    account,
    collectionId
  };
};
