const fs = require('fs');
const path = require('path');

const { flushCache } = require('../../modules/cachableSqlite');

const config = {
  databasePath: path.resolve(__dirname, '../../data')
};

module.exports = function (callback) {
  flushCache();
  fs.rmdir(config.databasePath, { recursive: true }, error => {
    if (error) {
      return callback(error);
    }
    callback();
  });
};
