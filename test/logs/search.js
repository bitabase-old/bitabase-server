const righto = require('righto');
const callarestJson = require('callarest/json');

const reset = require('../helpers/reset');
const createServer = require('../../server');
const rightoTest = require('../helpers/rightoTest');

function createTestCollection (callback) {
  callarestJson({
    url: 'http://localhost:8000/v1/databases/test/collections',
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
  }, callback);
}

rightoTest('list items in collection with default pagination', function * (t) {
  t.plan(10);

  yield righto(reset);
  const server = createServer();
  yield righto(server.start);

  yield righto(createTestCollection);

  const createWithError = righto(callarestJson, {
    url: 'http://localhost:8000/v1/databases/test/records/test',
    method: 'post',
    data: { test: 'testing' }
  });

  yield righto.handle(createWithError, (originalError, callback) => callback());

  const rest = yield righto(callarestJson, {
    url: 'http://localhost:8000/v1/databases/test/logs/test'
  });

  t.equal(rest.response.statusCode, 200);
  t.equal(rest.body[0].data.script, '{...$..... na}');
  t.equal(rest.body[0].data.scope.record.test, 'testing');
  t.equal(rest.body[0].data.scope.trace, 'records->create->present');
  t.equal(rest.body[0].data.scope.method, 'post');
  t.equal(rest.body[0].data.scope.request.method, 'POST');
  t.equal(rest.body[0].data.scope.request.databaseName, 'test');
  t.equal(rest.body[0].data.scope.request.collectionName, 'test');
  t.equal(rest.body[0].data.error.code, 'SCRIPT_EVALUATE_RUNTIME');
  t.equal(rest.body[0].data.error.message, 'Parse error,\nUnexpected token,\nAt 8 "{...$...-->.<--. na}"');

  yield righto(server.stop);
});
