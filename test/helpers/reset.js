const fs = require('fs');
const config = require('../../config');
const { flushCache } = require('../../modules/cachableSqlite');

module.exports = function (callback) {
  flushCache();
  fs.rmdir(config.databasePath, { recursive: true }, error => {
    if (error) {
      return callback(error);
    }
    callback();
  });
};
