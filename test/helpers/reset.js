const fs = require('fs')
const path = require('path')
const config = require('../../config')

module.exports = function () {
  return new Promise((resolve, reject) => {
    fs.rmdir(config.databasePath, { recursive: true }, err => {
      if (err) {
        return reject(err)
      }
      resolve()
    })
  })
}
