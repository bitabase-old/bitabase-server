const { promisify } = require('util')
const fs = require('fs')
const path = require('path')
const access = promisify(fs.access)
const readFile = promisify(fs.readFile)

const ErrorObject = require('../../modules/error')

module.exports = async function (account, collectionId) {
  if (account.match(/[^a-z0-9]/gi, '')) {
    console.log('Invalid database name')
    throw ErrorObject({ code: 404 })
  }

  if (collectionId.match(/[^a-z0-9]/gi, '')) {
    console.log('Invalid collection ID')
    throw ErrorObject({ code: 404 })
  }

  const configFile = path.resolve(__dirname, `../../data/${account}/${collectionId}`)

  try {
    await access(configFile + '.json', fs.constants.F_OK)
  } catch (err) {
    throw ErrorObject({ code: 404 })
  }

  let config = await readFile(configFile + '.json', 'utf8')
  config = JSON.parse(config)

  return { config, configFile, account, collectionId }
}
