const { promisify } = require('util')
const fs = require('fs')
const path = require('path')
const access = promisify(fs.access)

const config = require('../../config')
const connect = require('../../modules/db')

function sendError (statusCode, message, res) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json'
  })
  res.end(JSON.stringify(message, null, 2))
}

module.exports = config => async function (req, res, params) {
  const databaseName = params.databaseName

  if (databaseName.match(/[^a-z0-9]/gi, '')) {
    console.log('Invalid subdomain')
    return sendError(404, {}, res)
  }

  if (params.collectionId.match(/[^a-z0-9]/gi, '')) {
    console.log('Invalid collection ID')
    return sendError(404, {}, res)
  }

  const configFile = path.resolve(config.databasePath, `${databaseName}/${params.collectionId}`)

  try {
    await access(configFile + '.json', fs.constants.F_OK)
  } catch (err) {
    return sendError(404, {}, res)
  }

  const db = await connect(config.databasePath, configFile + '.db')

  const rows = await db.all(`SELECT * FROM ${params.collectionId}`)

  await db.close()

  res.end(JSON.stringify({
    count: rows.length,
    items: rows
  }))
}
