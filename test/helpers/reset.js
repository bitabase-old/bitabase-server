const fs = require('fs');
const config = require('../../config');
const { flushCache } = require('../../modules/cachableSqlite');

module.exports = function () {
  return new Promise((resolve, reject) => {
    flushCache();
    fs.rmdir(config.databasePath, { recursive: true }, err => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
};
