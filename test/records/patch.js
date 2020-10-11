const righto = require('righto');
const callarestJson = require('callarest/json');

const reset = require('../helpers/reset');
const createServer = require('../../server');
const rightoTest = require('../helpers/rightoTest');

rightoTest('patch a record returns new record', function * (t) {
  t.plan(3);

  yield righto(reset);
  const server = createServer();
  yield righto(server.start);

  yield righto(callarestJson, {
    url: 'http://localhost:8000/v1/databases/test/collections',
    method: 'post',
    body: {
      name: 'example',
      schema: {
        test1: ['required', 'string'],
        test2: ['string']
      }
    }
  });

  const testInsert = yield righto(callarestJson, {
    url: 'http://localhost:8000/v1/databases/test/records/example',
    method: 'post',
    body: {
      test1: 'first.a',
      test2: 'first.b'
    }
  });

  const testUpdate = yield righto(callarestJson, {
    url: 'http://localhost:8000/v1/databases/test/records/example/' + testInsert.body.id,
    method: 'patch',
    body: {
      test1: 'second'
    }
  });

  t.equal(testUpdate.response.statusCode, 200);
  t.equal(testUpdate.body.test1, 'second');
  t.equal(testUpdate.body.test2, 'first.b');

  yield righto(server.stop);
});

rightoTest('get patched record', function * (t) {
  t.plan(3);

  yield righto(reset);
  const server = createServer();
  yield righto(server.start);

  yield righto(callarestJson, {
    url: 'http://localhost:8000/v1/databases/test/collections',
    method: 'post',
    body: {
      name: 'example',
      schema: {
        test1: ['required', 'string'],
        test2: ['string']
      }
    }
  });

  const testInsert = yield righto(callarestJson, {
    url: 'http://localhost:8000/v1/databases/test/records/example',
    method: 'post',
    body: {
      test1: 'first.a',
      test2: 'first.b'
    }
  });

  yield righto(callarestJson, {
    url: 'http://localhost:8000/v1/databases/test/records/example/' + testInsert.body.id,
    method: 'patch',
    body: {
      test1: 'second.a'
    }
  });

  const testRead = yield righto(callarestJson, {
    url: 'http://localhost:8000/v1/databases/test/records/example/' + testInsert.body.id
  });

  t.equal(testRead.response.statusCode, 200);
  t.equal(testRead.body.test1, 'second.a');
  t.equal(testRead.body.test2, 'first.b');

  yield righto(server.stop);
});
