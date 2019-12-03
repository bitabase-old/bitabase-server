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
    data: {
      name: 'test',
      schema: {
        test: ['required', 'string']
      }
    }
  }, callback);
}

rightoTest('list items in collection when empty', function * (t) {
  t.plan(1);

  yield righto(reset);
  const server = createServer();
  yield righto(server.start);

  yield righto(createTestCollection);

  const rest = yield righto(callarestJson, {
    url: 'http://localhost:8000/v1/databases/test/records/test',
    method: 'get'
  });

  t.deepEqual(rest.body, {
    count: 0,
    items: []
  });

  yield righto(server.stop);
});

rightoTest('list items in collection with default pagination', function * (t) {
  t.plan(4);

  yield righto(reset);
  const server = createServer();
  yield righto(server.start);

  yield righto(createTestCollection);

  for (let i = 0; i < 100; i++) {
    yield righto(callarestJson, {
      url: 'http://localhost:8000/v1/databases/test/records/test',
      method: 'post',
      data: { test: 'testing' + i }
    });
  }

  const rest = yield righto(callarestJson, {
    url: 'http://localhost:8000/v1/databases/test/records/test',
    method: 'get'
  });

  t.equal(rest.response.statusCode, 200);
  t.equal(rest.body.count, 100);
  t.equal(rest.body.items.length, 10);
  t.equal(rest.body.items[0].test, 'testing0');

  yield righto(server.stop);
});

rightoTest('list items in collection with custom offset', function * (t) {
  t.plan(4);

  yield righto(reset);
  const server = createServer();
  yield righto(server.start);

  yield righto(createTestCollection);

  for (let i = 0; i < 100; i++) {
    yield righto(callarestJson, {
      url: 'http://localhost:8000/v1/databases/test/records/test',
      method: 'post',
      data: { test: 'testing' + i }
    });
  }

  const rest = yield righto(callarestJson, {
    url: 'http://localhost:8000/v1/databases/test/records/test?offset=10',
    method: 'get'
  });

  t.equal(rest.response.statusCode, 200);
  t.equal(rest.body.count, 100);
  t.equal(rest.body.items.length, 10);
  t.equal(rest.body.items[0].test, 'testing10');

  yield righto(server.stop);
});

rightoTest('list items in collection with query', function * (t) {
  t.plan(4);

  yield righto(reset);
  const server = createServer();
  yield righto(server.start);

  yield righto(createTestCollection);

  for (let i = 0; i < 100; i++) {
    yield righto(callarestJson, {
      url: 'http://localhost:8000/v1/databases/test/records/test',
      method: 'post',
      data: { test: 'testing' + i }
    });
  }

  const query = querystring.stringify({
    query: JSON.stringify({ test: 'testing51' })
  });

  const rest = yield righto(callarestJson, {
    url: 'http://localhost:8000/v1/databases/test/records/test?' + query,
    method: 'get'
  });

  yield righto(server.stop);

  t.equal(rest.response.statusCode, 200);
  t.equal(rest.body.count, 1);
  t.equal(rest.body.items.length, 1);
  t.equal(rest.body.items[0].test, 'testing51');
});

rightoTest('list items in collection with order', function * (t) {
  t.plan(4);

  yield righto(reset);
  const server = createServer();
  yield righto(server.start);

  yield righto(createTestCollection);

  for (let i = 0; i < 100; i++) {
    yield righto(callarestJson, {
      url: 'http://localhost:8000/v1/databases/test/records/test',
      method: 'post',
      data: {
        test: 'testing' + i
      }
    });
  }

  const rest = yield righto(callarestJson, {
    url: 'http://localhost:8000/v1/databases/test/records/test?order=desc(test)',
    method: 'get'
  });

  yield righto(server.stop);

  t.equal(rest.response.statusCode, 200);
  t.equal(rest.body.count, 100);
  t.equal(rest.body.items.length, 10);
  t.equal(rest.body.items[0].test, 'testing99');
});

rightoTest('list items in collection with custom pagination', function * (t) {
  t.plan(4);

  yield righto(reset);
  const server = createServer();
  yield righto(server.start);

  yield righto(createTestCollection);

  for (let i = 0; i < 100; i++) {
    yield righto(callarestJson, {
      url: 'http://localhost:8000/v1/databases/test/records/test',
      method: 'post',
      data: { test: 'testing' + i }
    });
  }

  const rest = yield righto(callarestJson, {
    url: 'http://localhost:8000/v1/databases/test/records/test?limit=100',
    method: 'get'
  });

  t.equal(rest.response.statusCode, 200);
  t.equal(rest.body.count, 100);
  t.equal(rest.body.items.length, 100);
  t.equal(rest.body.items[20].test, 'testing20');

  yield righto(server.stop);
});

rightoTest('list items in collection with custom query and order', function * (t) {
  t.plan(4);

  yield righto(reset);
  const server = createServer();
  yield righto(server.start);

  yield righto(createTestCollection);

  for (let i = 0; i < 10; i++) {
    yield righto(callarestJson, {
      url: 'http://localhost:8000/v1/databases/test/records/test',
      method: 'post',
      data: { test: 'testing' + i }
    });
  }

  const rest = yield righto(callarestJson, {
    url: 'http://localhost:8000/v1/databases/test/records/test?query={"test":"testing5"}&order=desc(test)',
    method: 'get'
  });

  t.equal(rest.response.statusCode, 200);
  t.equal(rest.body.count, 1);
  t.equal(rest.body.items.length, 1);
  t.equal(rest.body.items[0].test, 'testing5');

  yield righto(server.stop);
});
