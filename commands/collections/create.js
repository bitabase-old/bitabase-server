const fs = require('fs')
const path = require('path')

const mkdirp = require('mkdirp')
const righto = require('righto')
const sqlite = require('sqlite-fp')

const validate = require('./validate')
const connectWithCreate = require('../../modules/connectWithCreate')
const parseJsonBody = require('../../modules/parseJsonBodyCB')
const sendJsonResponse = require('../../modules/sendJsonResponse')
const ErrorObject = require('../../modules/error')

function createCollectionDatabase (databasePath, databaseName, collectionName, fields, callback) {
  const filePath = path.resolve(databasePath, `${databaseName}/${collectionName}.db`)
  const idField = 'id VARCHAR (36) PRIMARY KEY NOT NULL UNIQUE'

  const dbConnection = righto(connectWithCreate, filePath)
  const createdTable = righto(sqlite.run, `CREATE TABLE ${collectionName} (${idField} ${fields ? ', ' + fields : ''})`, dbConnection)
  const closedDatabase = righto(sqlite.close, dbConnection, righto.after(createdTable))

  closedDatabase(callback)
}

function createFieldsFromSchema (schema, callback) {
  const fields = Object.keys(schema || [])
    .map(fieldKey => {
      return `${fieldKey} TEXT`
    })
    .join(', ')

  callback(null, fields)
}

function createConfigFile (databasePath, databaseName, collectionConfig, callback) {
  const configFile = path.resolve(databasePath, `${databaseName}/${collectionConfig.name}.json`)
  const configFolder = path.dirname(configFile)

  const folderExists = righto(mkdirp, configFolder)
  const existingConfigFile = righto(fs.stat, configFile, righto.after(folderExists))

  existingConfigFile(function (error, existingConfig) {
    if (error && error.code === 'ENOENT') {
      return fs.writeFile(configFile, JSON.stringify(collectionConfig), callback)
    }

    callback(new ErrorObject({
      statusCode: 422,
      message: { errors: { name: 'already taken' } }
    }))
  })
}

module.exports = config => function (request, response, params) {
  const parsedData = righto(parseJsonBody, request)
  const validData = righto(validate, parsedData)

  const configFileCreated = righto(createConfigFile,
    config.databasePath, params.databaseName, validData)

  const fields = righto(createFieldsFromSchema, validData.get('schema'))

  const createdCollection = righto(createCollectionDatabase,
    config.databasePath, params.databaseName, validData.get('name'), fields, righto.after(configFileCreated))

  createdCollection(function (error, result) {
    if (error) {
      if (error.statusCode) {
        sendJsonResponse(error.statusCode, error.message, response)
      } else {
        sendJsonResponse(500, 'Unexpected Server Error', response)
      }
      return
    }

    sendJsonResponse(201, result, response)
  })
}
