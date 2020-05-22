const path = require('path');
const righto = require('righto');
const callarestJson = require('callarest/json');

const reset = require('../helpers/reset');
const createServer = require('../../server');
const rightoTest = require('../helpers/rightoTest');

const config = require('../../config');
const cachableSqlite = require('../../modules/cachableSqlite');

const sleep = (ms, callback) => setTimeout(callback, ms);

rightoTest('database stays open', function * (t) {
  t.plan(5);

  yield righto(reset);
  const server = createServer();
  yield righto(server.start);

  const dbFile = path.resolve(config.databasePath, 'test/users.db');

  yield righto(callarestJson, {
    url: 'http://localhost:8000/v1/databases/test/collections',
    method: 'post',
    body: {
      name: 'users',
      schema: {
        test: ['required', 'array']
      }
    }
  });

  const firstRead = yield righto(callarestJson, {
    url: 'http://localhost:8000/v1/databases/test/records/users/nothere',
    method: 'get'
  });

  const firstConnection = yield righto(cachableSqlite.getConnection, dbFile);

  yield righto(sleep, 1500);

  const secondRead = yield righto(callarestJson, {
    url: 'http://localhost:8000/v1/databases/test/records/users/nothere'
  });

  const secondConnection = yield righto(cachableSqlite.getConnection, dbFile);

  server.stop();

  t.equal(firstRead.response.statusCode, 404);
  t.deepEqual(firstRead.body, { error: 'Not Found' });
  t.equal(secondRead.response.statusCode, 404);
  t.deepEqual(secondRead.body, { error: 'Not Found' });
  t.notEqual(firstConnection.timeOpened, secondConnection.timeOpened);
});

rightoTest('database closes', function * (t) {
  t.plan(5);

  yield righto(reset);
  const server = createServer();
  yield righto(server.start);

  const dbFile = path.resolve(config.databasePath, 'test/users.db');

  yield righto(callarestJson, {
    url: 'http://localhost:8000/v1/databases/test/collections',
    method: 'post',
    body: {
      name: 'users',
      schema: {
        test: ['required', 'array']
      }
    }
  });

  const firstRead = yield righto(callarestJson, {
    url: 'http://localhost:8000/v1/databases/test/records/users/nothere',
    method: 'get'
  });

  const firstConnection = yield righto(cachableSqlite.getConnection, dbFile);

  yield righto(sleep, 500);

  const secondRead = yield righto(callarestJson, {
    url: 'http://localhost:8000/v1/databases/test/records/users/nothere'
  });

  const secondConnection = yield righto(cachableSqlite.getConnection, dbFile);

  server.stop();

  t.equal(firstRead.response.statusCode, 404);
  t.deepEqual(firstRead.body, { error: 'Not Found' });
  t.equal(secondRead.response.statusCode, 404);
  t.deepEqual(secondRead.body, { error: 'Not Found' });
  t.equal(firstConnection.timeOpened, secondConnection.timeOpened);
});
