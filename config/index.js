const path = require('path');

const config = {
  development: {
    bind: '0.0.0.0:8000',
    databasePath: path.resolve(__dirname, '../data'),
    databaseKeepAlive: 1000
  },

  production: {
    bind: '0.0.0.0:10000',
    databasePath: '/var/data',
    databaseKeepAlive: 30000
  }
};

module.exports = config[process.env.NODE_ENV || 'development'];
