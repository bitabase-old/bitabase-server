const path = require('path');

const config = {
  dev: {
    port: 8000,
    databasePath: path.resolve(__dirname, '../data'),
    databaseKeepAlive: 1000
  },

  production: {
    port: 10000,
    databasePath: '/var/data',
    databaseKeepAlive: 30000
  }
};

module.exports = config[process.env.NODE_ENV || 'dev'];
