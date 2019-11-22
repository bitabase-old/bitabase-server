const righto = require('righto');
const sqlite = require('sqlite-fp');
const writeResponse = require('write-response');

const getUser = require('../../modules/getUser');
const getCollection = require('../../modules/getCollection');
const applyPresentersToData = require('../../modules/applyPresentersToData');

module.exports = appConfig => function (request, response, params) {
  const username = request.headers.username
  const password = request.headers.password

  const collection = righto(getCollection(appConfig), params.databaseName, params.collectionId)

  const dbConnection = righto(sqlite.connect, collection.get('databaseFile'));

  const user = righto(getUser(appConfig), dbConnection, username, password);

  const records = righto(sqlite.getAll, `SELECT * FROM ${params.collectionId}`, dbConnection);

  const closedDatabase = righto(sqlite.close, dbConnection, righto.after(records))

  const presentableRecords = righto(applyPresentersToData, collection.get('config'), records, user, righto.after(closedDatabase))

  presentableRecords(function (error, records) {
    if (error) {
      return writeResponseError(error)
    }

    writeResponse(200, {
      count: records.length,
      items: records
    }, response)
  })
};
