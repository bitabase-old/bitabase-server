const config = {
  dev: {
    port: 8000
  },

  production: {
    port: 10000
  }
}

module.exports = config[process.env.NODE_ENV || 'dev']
