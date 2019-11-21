const connect = require('../../modules/db');
const getCollection = require('./getCollection');
const getUser = require('./getUser');
const finalStream = require('final-stream');
const writeResponse = require('write-response');
const evaluate = require('../../modules/evaluate');

const uuidv4 = require('uuid').v4;

module.exports = appConfig => async function (request, response, params) {
  finalStream(request, JSON.parse, async function (error, data) {
    try {
      if (error) {
        throw error;
      }

      const account = params.databaseName;

      let collection;
      try {
        collection = await getCollection(appConfig)(account, params.collectionId);
      } catch (error) {
        if (error.code !== 404) {
          throw error;
        }
      }

      if (!collection) {
        return writeResponse(404, { error: `the collection "${account}/${params.collectionId}" does not exist` }, response);
      }

      const { configFile, config } = collection;

      const db = await connect(appConfig.databasePath, configFile + '.db');

      const user = await getUser(appConfig)(db, request.headers.username, request.headers.password);

      // Validation
      const errors = {};

      if (!config.schema) {
        console.log('No schema provided', config);
        return writeResponse(500, {}, response);
      }

      Object.keys(config.schema).forEach(field => {
        if (config.schema[field].includes('required') && !data[field]) {
          errors[field] = errors[field] || [];
          errors[field].push('required');
        }
      });

      Object.keys(data).forEach(field => {
        if (!config.schema[field]) {
          errors[field] = errors[field] || [];
          errors[field].push('unknown field');
          return;
        }

        config.schema[field].forEach(checkFn => {
          if (checkFn === 'required') {
            return;
          }

          if (checkFn === 'string') {
            checkFn = 'typeOf(value) == "string" ? null : "must be string"';
          }

          if (checkFn === 'array') {
            checkFn = 'typeOf(value) == "Array" ? null : "must be array"';
          }

          const invalid = evaluate(checkFn, {
            value: data[field],
            user
          });

          if (invalid) {
            errors[field] = errors[field] || [];
            errors[field].push(invalid);
          }
        });
      });

      if (Object.values(errors).length > 0) {
        return writeResponse(400, errors, response);
      }

      // Rules
      if (config.rules && config.rules.POST) {
        const ruleErrors = []
        ;(config.rules.POST || []).forEach(rule => {
          const result = evaluate(rule, {
            data, user
          });

          if (result) {
            ruleErrors.push(result);
          }
        });

        if (Object.values(ruleErrors).length > 0) {
          return writeResponse(400, ruleErrors, response);
        }
      }

      // Mutations
      Object.keys(data).forEach(field => {
        if (config.schema[field].includes('array')) {
          data[field] = JSON.stringify(data[field]);
        }
      })

      ;(config.mutations || []).forEach(mutation => {
        evaluate(mutation, {
          data, user
        });
      });

      // Insert record
      const sql = `
        INSERT INTO ${params.collectionId} 
        (id, ${Object.entries(data).map(o => o[0]).join(', ')}) 
        VALUES 
        (?, ${Object.keys(data).fill('?').join(', ')})
      `;
      const stmt = await db.prepare(sql);
      const id = uuidv4();
      stmt.run(...[id, ...Object.entries(data).map(o => o[1])]);
      await stmt.finalize();

      await db.close()

      // Presenters
      ;(config.presenters || []).forEach(presenter => {
        evaluate(presenter, {
          data, user
        });
      });

      writeResponse(201, Object.assign(data, { id }), response);
    } catch (error) {
      if (!error.friendly) {
        console.log(error);
      }
      writeResponse(error.code || 500, error.friendly, response);
    }
  });
};
