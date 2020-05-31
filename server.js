if (process.env.NODE_ENV === 'development') {
  require('trace')
  require('clarify')
}

const http = require('http');
const defaultConfig = require('./config');

const createRouter = require('find-my-way');

function createServer (configOverrides = {}) {
  const config = {
    ...defaultConfig,
    ...configOverrides
  };

  const [host, port] = config.bind.split(':')

  const router = createRouter();
  router.on('GET', '/v1/databases/:databaseName/collections', require('./commands/collections/search.js')(config));
  router.on('GET', '/v1/databases/:databaseName/collections/:collectionName', require('./commands/collections/read.js')(config));
  router.on('POST', '/v1/databases/:databaseName/collections', require('./commands/collections/create.js')(config));
  router.on('PUT', '/v1/databases/:databaseName/collections/:collectionName', require('./commands/collections/update.js')(config));

  router.on('GET', '/v1/databases/:databaseName/records/:collectionName', require('./commands/records/search.js')(config));
  router.on('POST', '/v1/databases/:databaseName/records/:collectionName', require('./commands/records/create.js')(config));
  router.on('GET', '/v1/databases/:databaseName/records/:collectionName/:recordId', require('./commands/records/read.js')(config));
  router.on('DELETE', '/v1/databases/:databaseName/records/:collectionName/:recordId', require('./commands/records/delete.js')(config));
  router.on('DELETE', '/v1/databases/:databaseName/records/:collectionName', require('./commands/records/deleteByQuery.js')(config));

  router.on('GET', '/v1/databases/:databaseName/logs/:collectionName', require('./commands/logs/search.js')(config));

  let server;
  function start (callback) {
    server = http.createServer((request, response) => {
      router.lookup(request, response);
    }).listen(port, host);

    server.on('listening', function () {
      console.log(`[bitabase-server] Listening on ${host}:${port}`);

      callback && callback();
    });

    return { start, stop };
  }

  function stop (callback) {
    console.log('[bitabase-server] Shutting down');
    server && server.close();
    callback && callback();
  }

  return { start, stop };
}

module.exports = createServer;
