const { promisify } = require('util')
const fs = require('fs')
const mkdirp = require('mkdirp')
const path = require('path')
const validate = require('./validate')
const connect = require('../../modules/db')
const ensureDirectoryExists = require('../../modules/ensureDirectoryExists')
const parseJsonBody = require('../../modules/parseJsonBody')
const righto = require('righto')

function createCollectionConfig(databaseName, schema, callback){
  const databaseDirectory = path.resolve(__dirname, '../../data', `${databaseName}`)
  const configFilePath = path.join(databaseDirectory, `${schema.id}.json`)
  const databaseFilePath = `${databaseName}/${schema.id}.db`

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
  const directoryExists = righto(mkdirp, collectionConfig.databaseDirectory, righto.after(databaseAvailable))
  const configFileWritten = righto(fs.writeFile, collectionConfig.configFilePath, JSON.stringify(collectionDefinition), 'utf8', righto.after(directoryExists))
  const availableConfig = righto.mate(collectionConfig, righto.after(configFileWritten))

  availableConfig(callback)
}

function closeDb(db, callback){
  const closed = righto.from(db.close())

  closed(callback)
}

function respond(request, response){
  return function(error, result){
    if(error){
      // Respond
      response.writeHead(500, {
        'Content-Type': 'application/json'
      })
      response.end(JSON.stringify(error))
      return
    }
    // Respond
    response.writeHead(201, {
      'Content-Type': 'application/json'
    })
    response.end(JSON.stringify(result))
  }
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

module.exports = async function (request, response, params) {
  const databaseName = params.databaseName
  const collectionDefinition = righto.from(parseJsonBody(request))
  const validCollectionDefinition = righto.sync(data => {
    const errors = validate(data)
    return errors ? righto.fail(errors) : data
  }, collectionDefinition)
  const availableConfig = righto(createCollection, databaseName, validCollectionDefinition)
  const db = righto.sync(connect, availableConfig.get('databaseFilePath'))
  const tableCreated = righto(createTable, db, validCollectionDefinition)
  const dbClosed = righto(closeDb, db, righto.after(tableCreated))
  const result = righto.mate(validCollectionDefinition, righto.after(dbClosed))

  result(respond(request, response))
}
