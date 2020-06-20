#!/usr/bin/env node

if (process.env.NODE_ENV === 'development') {
  require('async-bugs');
}

const path = require('path');
const http = require('http');

const setupServerSyncer = require('./modules/setupServerSyncer');
const createRouter = require('find-my-way');

function createServer (config = {}) {
  config.bindHost = config.bindHost || '0.0.0.0';
  config.bindPort = config.bindPort || 8000;
  config.databasePath = config.databasePath || path.resolve('./data');
  config.databaseKeepAlive = config.databaseKeepAlive || 1000;

  let serverSyncer;

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
    serverSyncer = setupServerSyncer(config);

    server = http.createServer((request, response) => {
      router.lookup(request, response);
    }).listen(config.bindPort, config.bindHost);

    server.on('listening', function () {
      const address = server.address();
      console.log(`[bitabase-server] Listening on ${config.bindHost} (${address.address}:${address.port})`);

      callback && callback();
    });

    return { start, stop };
  }

  function stop (callback) {
    console.log('[bitabase-server] Shutting down');
    server && server.close();
    serverSyncer && serverSyncer.stop && serverSyncer.stop();
    callback && callback();
  }

  return { start, stop };
}

module.exports = createServer;
