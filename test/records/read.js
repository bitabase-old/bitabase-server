const test = require('tape');
const httpRequest = require('../helpers/httpRequest');
const reset = require('../helpers/reset');
const createServer = require('../../server');

test('arrays are returned as arrays', async t => {
  t.plan(4);

  await reset();

  const server = await createServer().start();

  await httpRequest('/v1/databases/test/collections', {
    method: 'post',
    data: {
      name: 'users',
      schema: {
        test: ['required', 'array']
      }
    }
  });

  const testInsert = await httpRequest('/v1/databases/test/records/users', {
    method: 'post',
    data: {
      test: ['something']
    }
  });

  const testRead = await httpRequest(`/v1/databases/test/records/users/${testInsert.data.id}`);

  await server.stop();

  t.equal(testInsert.status, 201);
  t.deepEqual(testInsert.data.test, ['something']);

  t.equal(testRead.status, 200);
  t.deepEqual(testRead.data.test, ['something']);
});

test('numbers are returned as numbers', async t => {
  t.plan(4);

  await reset();

  const server = await createServer().start();

  await httpRequest('/v1/databases/test/collections', {
    method: 'post',
    data: {
      name: 'tests',
      schema: {
        test: ['required', 'number']
      }
    }
  });

  const testInsert = await httpRequest('/v1/databases/test/records/tests', {
    method: 'post',
    data: {
      test: 100
    }
  });

  const testRead = await httpRequest(`/v1/databases/test/records/tests/${testInsert.data.id}`);

  await server.stop();

  t.equal(testInsert.status, 201);
  t.deepEqual(testInsert.data.test, 100);

  t.equal(testRead.status, 200);
  t.deepEqual(testRead.data.test, 100);
});
