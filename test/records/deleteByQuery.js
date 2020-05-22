const querystring = require('querystring');

const righto = require('righto');
const callarestJson = require('callarest/json');

const reset = require('../helpers/reset');
const createServer = require('../../server');
const rightoTest = require('../helpers/rightoTest');

function createTestCollection (callback) {
  callarestJson({
    url: 'http://localhost:8000/v1/databases/test/collections',
    method: 'post',
    body: {
      name: 'test',
      schema: {
        test: ['required', 'string']
      }
    }
  }, callback);
}

rightoTest('delete items from collection with query', function * (t) {
  t.plan(5);

  yield righto(reset);
  const server = createServer();
  yield righto(server.start);

  yield righto(createTestCollection);

  for (let i = 0; i < 100; i++) {
    yield righto(callarestJson, {
      url: 'http://localhost:8000/v1/databases/test/records/test',
      method: 'post',
      body: { test: 'testing' + i }
    });
  }

  const query = querystring.stringify({
    query: JSON.stringify({ test: 'testing51' })
  });

  const deleted = yield righto(callarestJson, {
    url: 'http://localhost:8000/v1/databases/test/records/test?' + query,
    method: 'delete'
  });

  t.equal(deleted.response.statusCode, 200);
  t.equal(deleted.body.count, 1);

  const remaining = yield righto(callarestJson, {
    url: 'http://localhost:8000/v1/databases/test/records/test?limit=100',
    method: 'get'
  });

  yield righto(server.stop);

  t.equal(remaining.response.statusCode, 200);
  t.equal(remaining.body.count, 99);
  t.equal(remaining.body.items.length, 99);
});
