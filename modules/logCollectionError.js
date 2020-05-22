const uuidv4 = require('uuid').v4;
const righto = require('righto');
const sqlite = require('sqlite-fp');

const { getConnection } = require('./cachableSqlite');

function logCollectionError (collectionConfig, error, callback) {
  const id = uuidv4();

  const sqlTableCreate = `
    CREATE TABLE IF NOT EXISTS "_${collectionConfig.collectionName}_errors" (
      id TEXT PRIMARY KEY,
      data TEXT,
      date_created TEXT
    );
  `;

  const sql = `
    INSERT INTO "_${collectionConfig.collectionName}_errors"
      (id, data, date_created)
    VALUES 
      (?, ?, ?)
  `;

  let dataString = 'Unknown Error';
  try {
    dataString = JSON.stringify(error);
  } catch (error) {

  }

  const preparedValuesWithId = [id, dataString, Date.now()];
  const dbConnection = righto(getConnection, collectionConfig.databaseFile);
  const executedBuildQuery = righto(sqlite.run, dbConnection, sqlTableCreate);
  const executedQuery = righto(sqlite.run, dbConnection, sql, preparedValuesWithId, righto.after(executedBuildQuery));

  executedQuery(function (error, result) {
    callback(error, result);
  });
}

module.exports = logCollectionError;
