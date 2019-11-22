const test = require('tape');
const httpRequest = require('../helpers/httpRequest');
const reset = require('../helpers/reset');
const createServer = require('../../server');

async function createTestCollection () {
  await httpRequest('/v1/databases/test/collections', {
    method: 'post',
    data: {
      name: 'test',
      schema: {
        test: ['required', 'string']
      }
    }
  });
}

test('list items in collection when empty', async t => {
  t.plan(1);
  await reset();

  const server = await createServer().start();

  await createTestCollection();

  const response = await httpRequest('/v1/databases/test/collections/test/records', {
    method: 'get'
  });

  t.deepEqual(response.data, {
    count: 0,
    items: []
  });

  await server.stop();
});
