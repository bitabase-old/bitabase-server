const getCollection = require('./getCollection');
const { promisify } = require('util');
const evaluate = promisify(require('../../modules/evaluate'));
const getUser = require('./getUser');
const connect = require('../../modules/db');

function sendError (statusCode, message, res) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json'
  });
  res.end(JSON.stringify(message, null, 2));
}

module.exports = appConfig => async function (req, res, params) {
  const collection = await getCollection(appConfig)(params.databaseName, params.collectionId);

  const { configFile, config } = collection;

  const db = await connect(appConfig.databasePath, configFile + '.db');

  const user = await promisify(getUser(appConfig))(db, req.headers.username, req.headers.password);

  const rows = await db.all(`SELECT * FROM ${params.collectionId} WHERE id = ?`, [params.recordId]);

  await db.close();

  let data = rows[0];

  if (!data) {
    return sendError(404, {}, res);
  }

  // Presenters
  const presenters = await Promise.all(
    (config.presenters || []).map(async presenter => {
      return evaluate(presenter, {
        data, user
      });
    })
  );

  presenters.forEach(presenter => {
    data = { ...data, ...presenter };
  });

  res.end(JSON.stringify(data));
};
