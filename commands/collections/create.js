const { promisify } = require('util')
const fs = require('fs')
const path = require('path')
const validate = require('./validate')
const connect = require('../../modules/db')
const ensureDirectoryExists = require('../../modules/ensureDirectoryExists')
const parseJsonBody = require('../../modules/parseJsonBody')

function createCollectionConfig(databaseName, schema, callback){
  const databaseDirectory = path.resolve(__dirname, '../../data', `${params.databaseName}`)
  const configFilePath = path.join(databaseDirectory, `${schema.id}.json`)
  const databaseFilePath = `${params.databaseName}/${data.id}.db`

  return {
    databaseDirectory,
    configFilePath,
    databaseFilePath
  }
}

function createCollection(databaseName, collectionDefinition, callback){
  const collectionConfig = createCollectionConfig(databaseName, collectionDefinition)
  const configFileStat = righto(fs.stat, collectionConfig.configFilePath)
  const databaseAvailable = righto.handle(configFileStat, (error, callback) => {
    callback(error.code === 'ENOENT' ? null : error)
  })
  const directoryExists = righto(ensureDirectoryExists, collectionConfig.databaseDirectory, { resolve: true })
  const configFileWritten = righto(fs.writeFile, createCollection.configFilePath, JSON.stringify(collectionDefinition), 'utf8', righto.after(directoryExists))
  const availableConfig = righto.mate(collectionConfig, righto.after(configFileWritten))

  availableConfig(callback)
}

function closeDb(db, callback){
  const closed = righto.from(db.close())

  closed(callback)
}

function respond(error, result){
  if(error){
    // Respond
    res.writeHead(500, {
      'Content-Type': 'application/json'
    })
    res.end(JSON.stringify(error))
    return
  }
  // Respond
  res.writeHead(201, {
    'Content-Type': 'application/json'
  })
  res.end(JSON.stringify(result))
}

function getDbFields(collectionDefinition){
  return Object.keys(collectionDefinition.schema || [])
    .map(fieldKey => {
      return `${fieldKey} TEXT`
    })
    .join(', ')
}

function createTable(db, collectionDefinition, callback){
  const idField = 'id VARCHAR (36) PRIMARY KEY NOT NULL UNIQUE'
  const fields = getDbFields(collectionDefinition)
  const tableCreated = righto.from(db.run(`CREATE TABLE ${collectionDefinition.id} (${idField} ${fields ? ', ' + fields : ''})`))

  tableCreated(callback)
}

module.exports = async function (req, res, params) {
  const databaseName = params.databaseName
  const collectionDefinition = righto.from(parseJsonBody(req))
  const validCollectionDefinition = righto(validate, collectionDefinition)
  const availableConfig = righto(createCollection, validCollectionDefinition)
  const db = righto.sync(connect, availableConfig.get('databaseFilePath'))
  const tableCreated = righto(createTable, db, validCollectionDefinition)
  const dbClosed = righto(closeDb, db, righto.after(tableCreated))
  const result = righto.mate(validCollectionDefinition, righto.after(dbClosed))

  result(respond)
}
