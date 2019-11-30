const righto = require('righto');
const callarestJson = require('callarest/json');

const reset = require('../helpers/reset');
const createServer = require('../../server');
const rightoTest = require('../helpers/rightoTest');

rightoTest('records read not found', function * (t) {
  t.plan(2);

  yield righto(reset);
  const server = createServer();
  yield righto(server.start);

  yield righto(callarestJson, {
    url: 'http://localhost:8000/v1/databases/test/collections',
    method: 'post',
    data: {
      name: 'users',
      schema: {
        test: ['required', 'array']
      }
    }
  });

  const testRead = yield righto(callarestJson, {
    url: 'http://localhost:8000/v1/databases/test/records/users/nothere'
  });

  yield righto(server.stop);

  t.equal(testRead.response.statusCode, 404);
  t.deepEqual(testRead.body, { error: 'Not Found' });
});

rightoTest('arrays are returned as arrays', function * (t) {
  t.plan(4);

  yield righto(reset);
  const server = createServer();
  yield righto(server.start);

  yield righto(callarestJson, {
    url: 'http://localhost:8000/v1/databases/test/collections',
    method: 'post',
    data: {
      name: 'users',
      schema: {
        test: ['required', 'array']
      }
    }
  });

  const testInsert = yield righto(callarestJson, {
    url: 'http://localhost:8000/v1/databases/test/records/users',
    method: 'post',
    data: {
      test: ['something']
    }
  });

  const testRead = yield righto(callarestJson, {
    url: `http://localhost:8000/v1/databases/test/records/users/${testInsert.body.id}`
  });

  yield righto(server.stop);

  t.equal(testInsert.response.statusCode, 201);
  t.deepEqual(testInsert.body.test, ['something']);

  t.equal(testRead.response.statusCode, 200);
  t.deepEqual(testRead.body.test, ['something']);
});

rightoTest('numbers are returned as numbers', function * (t) {
  t.plan(4);

  yield righto(reset);
  const server = createServer();
  yield righto(server.start);

  yield righto(callarestJson, {
    url: 'http://localhost:8000/v1/databases/test/collections',
    method: 'post',
    data: {
      name: 'tests',
      schema: {
        test: ['required', 'number']
      }
    }
  });

  const testInsert = yield righto(callarestJson, {
    url: 'http://localhost:8000/v1/databases/test/records/tests',
    method: 'post',
    data: {
      test: 100
    }
  });

  const testRead = yield righto(callarestJson, {
    url: `http://localhost:8000/v1/databases/test/records/tests/${testInsert.body.id}`
  });

  yield righto(server.stop);

  t.equal(testInsert.response.statusCode, 201);
  t.deepEqual(testInsert.body.test, 100);

  t.equal(testRead.response.statusCode, 200);
  t.deepEqual(testRead.body.test, 100);
});
