const connect = require('../../modules/db');
const getCollection = require('./getCollection');
const finalStream = require('final-stream');
const writeResponse = require('write-response');
const {promisify} = require('util');
const getUser = require('./getUser');
const evaluate = promisify(require('../../modules/evaluate'));

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

      const user = await promisify(getUser(appConfig))(db, request.headers.username, request.headers.password);

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

      const promises = Object.keys(data).map(async field => {
        if (!config.schema[field]) {
          errors[field] = errors[field] || [];
          errors[field].push('unknown field');
          return;
        }

        const promises = config.schema[field].map(async checkFn => {
          if (checkFn === 'required') {
            return;
          }

          if (checkFn === 'string') {
            checkFn = 'getType(value) == "string" ? null : "must be string"';
          }

          if (checkFn === 'array') {
            checkFn = 'getType(value) == "Array" ? null : "must be array"';
          }

          const invalid = await evaluate(checkFn, {
            value: data[field],
            user
          });

          if (invalid) {
            errors[field] = errors[field] || [];
            errors[field].push(invalid);
          }
        });

        await Promise.all(promises);
      });

      await Promise.all(promises);

      if (Object.values(errors).length > 0) {
        return writeResponse(400, errors, response);
      }

      // Rules
      if (config.rules && config.rules.POST) {
        const ruleErrors = [];

        const promises = (config.rules.POST || []).map(async rule => {
          const result = await evaluate(rule, {
            data, user
          });

          if (result) {
            ruleErrors.push(result);
          }
        });

        await Promise.all(promises);

        if (Object.values(ruleErrors).length > 0) {
          return writeResponse(400, ruleErrors, response);
        }
      }

      // Mutations
      Object.keys(data).forEach(field => {
        if (config.schema[field].includes('array')) {
          data[field] = JSON.stringify(data[field]);
        }
      });

      const mutations = await Promise.all(
        (config.mutations || []).map(async mutation => {
          return await evaluate(mutation, {
            data, user
          });
        })
      );

      mutations.forEach(mutation => {
        data = {...data, ...mutation}
      })

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
      const presenters = await Promise.all(
        (config.presenters || []).map(async presenter => {
          return await evaluate(presenter, {
            data, user
          });
        })
      );

      presenters.forEach(presenter => {
        data = {...data, ...presenter}
      })

      writeResponse(201, Object.assign(data, { id }), response);
    } catch (error) {
      if (!error.friendly) {
        console.log(error);
      }
      writeResponse(error.code || 500, error.friendly, response);
    }
  });
};
