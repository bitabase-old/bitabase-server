const path = require('path');
const fs = require('fs');

const sqlite = require('sqlite-fp');

function connectWithCreate (filePath, callback) {
  const fileDirectory = path.dirname(filePath);
  fs.mkdir(fileDirectory, { recursive: true }, function (error, result) {
    if (error) {
      throw error;
    }

    sqlite.connect(filePath, callback);
  });
}

module.exports = connectWithCreate;
