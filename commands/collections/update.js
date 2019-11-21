const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

const writeResponse = require('write-response');
const finalStream = require('final-stream');

const writeFile = promisify(fs.writeFile);

const validate = require('./validate');
const connect = require('../../modules/db');
const ensureDirectoryExists = require('../../modules/ensureDirectoryExists');

async function getConfig (filename) {
  return new Promise((resolve, reject) => {
    fs.stat(filename, (err, stat) => {
      if (err) {
        if (err.code === 'ENOENT') {
          return resolve();
        } else {
          return reject(err);
        }
      } else {
        resolve(stat);
      }
    });
  });
}

module.exports = config => function (request, response, params) {
  finalStream(request, JSON.parse, async function (error, data) {
    if (error) {
      writeResponse(500, 'Unexpected Server Error', response);
      return;
    }

    data.id = params.collectionId;

    // Validation
    const errors = validate(data);
    if (errors) {
      return writeResponse(422, { errors }, response);
    }

    // Configuration
    const configFile = path.resolve(config.databasePath, `${params.databaseName}/${data.id}.json`);

    await ensureDirectoryExists(configFile, { resolve: true });

    const existingConfig = await getConfig(configFile);
    if (!existingConfig) {
      return writeResponse(404, {}, response);
    }

    await writeFile(configFile, JSON.stringify(data));

    // Alter db
    const db = await connect(config.databasePath, `${params.databaseName}/${data.id}.db`);

    const existingFields = (await db.all(`PRAGMA table_info(${data.id})`))
      .map(field => field.name);

    const fieldsToDelete = existingFields
      .filter(field => field !== 'id' && !Object.keys(data.schema).includes(field))
      .map(field => `${field}=''`);

    const fieldsToAdd = Object.keys(data.schema)
      .filter(field => field !== 'id' && !existingFields.includes(field))
      .map(field => {
        return db.run(`ALTER TABLE ${data.id} ADD ${field} TEXT`);
      });
    await Promise.all(fieldsToAdd);

    if (fieldsToDelete.length > 0) {
      await db.run(`UPDATE ${data.id} SET ${fieldsToDelete.join(', ')}`);
    }

    await db.close();

    // Respond
    writeResponse(200, data, response);
  });
};
