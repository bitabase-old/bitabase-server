const righto = require('righto');
const callarestJson = require('callarest/json');

const reset = require('../helpers/reset');
const createServer = require('../../server');
const rightoTest = require('../helpers/rightoTest');

rightoTest('delete record by id not found', function * (t) {
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

  const testDelete = yield righto(callarestJson, {
    method: 'delete',
    url: 'http://localhost:8000/v1/databases/test/records/users/nothere'
  });

  yield righto(server.stop);

  t.equal(testDelete.response.statusCode, 404);
  t.deepEqual(testDelete.body, { error: 'Not Found' });
});

rightoTest('delete record by id', function * (t) {
  t.plan(3);

  yield righto(reset);
  const server = createServer();
  yield righto(server.start);

  yield righto(callarestJson, {
    url: 'http://localhost:8000/v1/databases/test/collections',
    method: 'post',
    data: {
      name: 'users',
      schema: {
        test: ['required', 'string']
      }
    }
  });

  const testInsert = yield righto(callarestJson, {
    url: 'http://localhost:8000/v1/databases/test/records/users',
    method: 'post',
    data: {
      test: 'value'
    }
  });

  const testDelete = yield righto(callarestJson, {
    method: 'delete',
    url: `http://localhost:8000/v1/databases/test/records/users/${testInsert.body.id}`
  });

  yield righto(server.stop);

  t.equal(testInsert.response.statusCode, 201);
  t.deepEqual(testInsert.body.test, 'value');

  t.equal(testDelete.response.statusCode, 200);
});
