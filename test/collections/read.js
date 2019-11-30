const righto = require('righto');
const callarestJson = require('callarest/json');

const reset = require('../helpers/reset');
const createServer = require('../../server');
const rightoTest = require('../helpers/rightoTest');

function createTestCollection (callback) {
  return callarestJson({
    url: 'http://localhost:8000/v1/databases/test/collections',
    method: 'post',
    data: {
      name: 'test',
      schema: {
        test: ['required', 'string']
      }
    }
  }, callback);
}

rightoTest('collections.read: read not found collection', function * (t) {
  t.plan(2);

  yield righto(reset);
  const server = createServer();
  yield righto(server.start);

  const rest = yield righto(callarestJson, {
    url: 'http://localhost:8000/v1/databases/test/collections/notfound'
  });
  yield righto(server.stop);

  t.equal(rest.response.statusCode, 404);
  t.deepEqual(rest.body, { error: 'the collection "test/notfound" does not exist' });
});

rightoTest('collections.read: read existing collection', function * (t) {
  t.plan(2);

  yield righto(reset);
  const server = createServer();
  yield righto(server.start);

  const collection = yield righto(createTestCollection);

  const rest = yield righto(callarestJson, {
    url: `http://localhost:8000/v1/databases/test/collections/${collection.body.name}`
  });
  yield righto(server.stop);

  t.equal(rest.response.statusCode, 200);
  t.deepEqual(rest.body, {
    name: 'test',
    schema: { test: ['required', 'string'] }
  });
});
