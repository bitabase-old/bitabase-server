const writeResponse = require('write-response');

function writeResponseError (error, response) {
  if (error.statusCode) {
    writeResponse(error.statusCode, error.message, response);
  } else {
    console.log(error);
    writeResponse(500, 'Unexpected Server Error', response);
  }
  return;
}

module.exports = writeResponseError
