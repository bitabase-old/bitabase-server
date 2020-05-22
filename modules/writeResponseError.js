const writeResponse = require('write-response');

function writeResponseError (error, response) {
  if (error.statusCode) {
    writeResponse(error.statusCode, error.friendly || error.message, response);
  } else {
    console.log('Unhandled Error:', error);
    writeResponse(500, 'Unexpected Server Error', response);
  }
}

module.exports = writeResponseError;
