const path = require('path')

const config = {
  dev: {
    port: 8000,
    databasePath: path.resolve(__dirname, '../data')
  },

  production: {
    port: 10000,
    databasePath: path.resolve(__dirname, '../data')
  }
}

module.exports = config[process.env.NODE_ENV || 'dev']
