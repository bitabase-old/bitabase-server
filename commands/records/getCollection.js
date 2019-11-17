const { promisify } = require('util')
const fs = require('fs')
const path = require('path')
const access = promisify(fs.access)
const readFile = promisify(fs.readFile)

const ErrorObject = require('../../modules/error')

module.exports = config => async function (account, collectionId) {
  if (account.match(/[^a-z0-9]/gi, '')) {
    console.log('Invalid database name')
    throw ErrorObject({ code: 404 })
  }

  if (collectionId.match(/[^a-z0-9]/gi, '')) {
    console.log('Invalid collection ID')
    throw ErrorObject({ code: 404 })
  }

  const collectionConfigFile = path.resolve(config.databasePath, `${account}/${collectionId}`)
  try {
    await access(collectionConfigFile + '.json', fs.constants.F_OK)
  } catch (err) {
    throw ErrorObject({ code: 404 })
  }

  let collectionConfig = await readFile(collectionConfigFile + '.json', 'utf8')
  collectionConfig = JSON.parse(collectionConfig)

  return {
    config: collectionConfig,
    configFile: collectionConfigFile,
    account,
    collectionId
  }
}
