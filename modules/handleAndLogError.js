const righto = require('righto');
const writeResponseError = require('./writeResponseError');
const logCollectionError = require('./logCollectionError');

function handleAndLogError (collection, error, response) {
  const logged = righto(logCollectionError, collection, error);
  logged(loggerError => {
    loggerError && console.log(loggerError);
    writeResponseError(error, response);
  });
}

module.exports = handleAndLogError;
