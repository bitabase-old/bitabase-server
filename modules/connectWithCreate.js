const sqlite = require('sqlite-fp');
const mkdirp = require('mkdirp');
const path = require('path');

function connectWithCreate (filePath, callback) {
  const fileDirectory = path.dirname(filePath);
  mkdirp(fileDirectory, function (error, result) {
    if (error) {
      throw error;
    }

    sqlite.connect(filePath, callback);
  });
}

module.exports = connectWithCreate;
