const evaluate = require('../../modules/evaluate');
const getCollection = require('./getCollection');
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

  const user = await getUser(appConfig)(db, req.headers.username, req.headers.password);

  const rows = await db.all(`SELECT * FROM ${params.collectionId} WHERE id = ?`, [params.recordId]);

  await db.close();

  const data = rows[0];

  if (!data) {
    return sendError(404, {}, res);
  }

  // Presenters
  (config.presenters || []).forEach(presenter => {
    evaluate(presenter, {
      data, user
    });
  });

  res.end(JSON.stringify(data));
};
