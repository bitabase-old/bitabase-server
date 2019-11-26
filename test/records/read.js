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

  const testInsert = await httpRequest('/v1/databases/test/collections/users/records', {
    method: 'post',
    data: {
      test: ['something']
    }
  });

  const testRead = await httpRequest(`/v1/databases/test/collections/users/records/${testInsert.data.id}`);

  await server.stop();

  t.equal(testInsert.status, 201);
  t.deepEqual(testInsert.data.test, ['something']);

  t.equal(testRead.status, 200);
  t.deepEqual(testRead.data.test, ['something']);
});
