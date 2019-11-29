const path = require('path');
const righto = require('righto');
const callarestJson = require('callarest/json');

const config = require('../../config');
const test = require('tape');
const reset = require('../helpers/reset');
const createServer = require('../../server');

const cachableSqlite = require('../../modules/cachableSqlite');

const sleep = (ms, callback) => setTimeout(callback, ms);

test('database stays open', async t => {
  t.plan(5);

  await reset();

  const server = await createServer().start();
  const dbFile = path.resolve(config.databasePath, 'test/users.db');

  righto.iterate(function * () {
    yield righto(callarestJson, {
      url: 'http://localhost:8000/v1/databases/test/collections',
      method: 'post',
      data: {
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
  })(error => error && console.log(error));
});

test('database stays open', async t => {
  t.plan(5);

  await reset();

  const server = await createServer().start();
  const dbFile = path.resolve(config.databasePath, 'test/users.db');

  righto.iterate(function * () {
    yield righto(callarestJson, {
      url: 'http://localhost:8000/v1/databases/test/collections',
      method: 'post',
      data: {
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
  })(error => error && console.log(error));
});
