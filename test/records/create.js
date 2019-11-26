const test = require('tape');
const httpRequest = require('../helpers/httpRequest');
const reset = require('../helpers/reset');
const createServer = require('../../server');

test('transformations run before schema validations', async t => {
  t.plan(2);
  await reset();

  const server = await createServer().start();

  await httpRequest('/v1/databases/test/collections', {
    method: 'post',
    data: {
      name: 'users',
      schema: {
        test: ['required', 'string']
      },
      mutations: [
        '{...body test: "text"}'
      ]
    }
  });

  const testInsert = await httpRequest('/v1/databases/test/collections/users/records', {
    headers: {
      'x-test-headers': 'test-header-value'
    },
    method: 'post',
    data: {
      test: 1
    }
  });

  t.equal(testInsert.status, 201);
  t.equal(testInsert.data.test, 'text');

  await server.stop();
});
