const test = require('tape');
const httpRequest = require('../helpers/httpRequest');
const reset = require('../helpers/reset');
const createServer = require('../../server');

test('list collections: empty', async t => {
  t.plan(1);
  await reset();

  const server = await createServer().start();

  const response = await httpRequest('/v1/databases/test/collections', {
    method: 'get'
  });

  await server.stop();

  t.deepEqual(response.data, {
    count: 0,
    items: []
  });
});

test('list collections: one db', async t => {
  t.plan(1);
  await reset();

  const server = await createServer().start();

  // Create a collection
  await httpRequest('/v1/databases/test/collections', {
    method: 'post',
    data: {
      name: 'test',

      // Creating and updating items must conform to this schema
      schema: {
        test: ['required', 'string']
      }
    }
  });

  // Create a record
  await httpRequest('/v1/databases/test/collections/test', {
    method: 'post',
    data: {
      test: 'onse'
    }
  });

  const response = await httpRequest('/v1/databases/test/collections', {
    method: 'get'
  });

  await server.stop();

  t.deepEqual(response.data, {
    count: 1,
    items: ['test']
  });
});
