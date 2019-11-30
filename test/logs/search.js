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
      },
      presenters: [
        '{...$..... na}'
      ]
    }
  });
}

test('list items in collection with default pagination', async t => {
  t.plan(10);
  await reset();

  const server = await createServer().start();

  await createTestCollection();

  await httpRequest('/v1/databases/test/records/test', {
    method: 'post',
    data: { test: 'testing' },
    validateStatus: statusCode => 500
  });

  const response = await httpRequest('/v1/databases/test/logs/test', {
    method: 'get'
  });

  t.equal(response.status, 200);
  t.equal(response.data[0].data.script, '{...$..... na}');
  t.equal(response.data[0].data.scope.record.test, 'testing');
  t.equal(response.data[0].data.scope.trace, 'records->create->present');
  t.equal(response.data[0].data.scope.method, 'post');
  t.equal(response.data[0].data.scope.request.method, 'POST');
  t.equal(response.data[0].data.scope.request.databaseName, 'test');
  t.equal(response.data[0].data.scope.request.collectionName, 'test');
  t.equal(response.data[0].data.error.code, 'SCRIPT_EVALUATE_RUNTIME');
  t.equal(response.data[0].data.error.message, 'Parse error,\nUnexpected token,\nAt 8 "{...$...-->.<--. na}"');

  await server.stop();
});
