const { promisify } = require('util')
const fs = require('fs')
const path = require('path')
const access = promisify(fs.access)
const readFile = promisify(fs.readFile)

module.exports = function (account, collectionId) {
  return new Promise(async (resolve, reject) => {
    if (account.match(/[^a-z0-9]/gi, '')) {
      console.log('Invalid subdomain')
      return reject({ code: 404 })
    }

    if (collectionId.match(/[^a-z0-9]/gi, '')) {
      console.log('Invalid collection ID')
      return reject({ code: 404 })
    }

    const configFile = path.resolve(__dirname, `../../data/${account}/${collectionId}`)

    try {
      await access(configFile + '.json', fs.constants.F_OK)
    } catch (err) {
      return reject({ code: 404 })
    }

    let config = await readFile(configFile + '.json', 'utf8')
    config = JSON.parse(config)

    resolve({ config, configFile, account, collectionId })
  })
}
