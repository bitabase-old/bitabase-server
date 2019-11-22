const test = require('tape');
const httpRequest = require('../helpers/httpRequest');
const reset = require('../helpers/reset');
const createServer = require('../../server');

async function createTestCollection () {
  return httpRequest('/v1/databases/test/collections', {
    method: 'post',
    data: {
      name: 'test',
      schema: {
        test: ['required', 'string']
      }
    }
  });
}

test('collections.read: read not found collection', async t => {
  t.plan(2);
  await reset();

  const server = await createServer().start();

  const response = await httpRequest('/v1/databases/test/collections/notfound');
  await server.stop();

  t.equal(response.status, 404);
  t.equal(response.data, 'Not Found');
});

test('collections.read: read existing collection', async t => {
  t.plan(2);
  await reset();

  const server = await createServer().start();

  const collection = await createTestCollection();

  const response = await httpRequest(`/v1/databases/test/collections/${collection.data.name}`);
  await server.stop();

  t.equal(response.status, 200);
  t.deepEqual(response.data, {
    name: 'test',
    schema: { test: ['required', 'string'] }
  });
});
