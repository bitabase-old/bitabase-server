const http = require('http');
const defaultConfig = require('./config');

const createRouter = require('find-my-way');

function createServer (configOverrides = {}) {
  const config = {
    ...defaultConfig,
    ...configOverrides
  };

  const router = createRouter();
  router.on('GET', '/v1/databases/:databaseName/collections', require('./commands/collections/search.js')(config));
  router.on('GET', '/v1/databases/:databaseName/collections/:collectionName', require('./commands/collections/read.js')(config));
  router.on('POST', '/v1/databases/:databaseName/collections', require('./commands/collections/create.js')(config));
  router.on('PUT', '/v1/databases/:databaseName/collections/:collectionName', require('./commands/collections/update.js')(config));

  router.on('GET', '/v1/databases/:databaseName/records/:collectionName', require('./commands/records/search.js')(config));
  router.on('POST', '/v1/databases/:databaseName/records/:collectionName', require('./commands/records/create.js')(config));
  router.on('GET', '/v1/databases/:databaseName/records/:collectionName/:recordId', require('./commands/records/read.js')(config));

  router.on('GET', '/v1/databases/:databaseName/logs/:collectionName', require('./commands/logs/search.js')(config));

  let server;
  function start () {
    server = http.createServer((req, res) => {
      router.lookup(req, res);
    }).listen(config.port);

    console.log(`[bitabase-server] Listening on port ${config.port}`);

    return { start, stop };
  }

  function stop () {
    console.log('[bitabase-server] Shutting down');
    server && server.close();
  }

  return { start, stop };
}

module.exports = createServer;
