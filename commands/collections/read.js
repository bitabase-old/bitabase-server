const {promisify} = require('util')
const fs = require('fs')
const path = require('path')
const access = promisify(fs.access)
const readFile = promisify(fs.readFile)

const evaluate = require('../../modules/evaluate')
const getCollection = require('./getCollection')
const getUser = require('./getUser')
const connect = require('../../modules/db')

function sendError (statusCode, message, res) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json'
  })
  res.end(JSON.stringify(message, null, 2))
}

module.exports = async function (req, res, params) {
  const account = req.headers.host.split('.')[0]

  const collection = await getCollection(account, params.collectionId)

  const {configFile, config} = collection

  const db = await connect(configFile + '.db')

  let user = await getUser(db, req.headers['username'], req.headers['password'])

  const rows = await db.all(`SELECT * FROM ${params.collectionId} WHERE id = ?`, [params.recordId])
  
  await db.close()  

  const data = rows[0]

  if (!data) {
    return sendError(404, {}, res)
  }

  // Presenters
  ;(config.presenters || []).forEach(presenter => {
    const result = evaluate(presenter, {
      data, user
    })
  })

  res.end(JSON.stringify(data))
}
