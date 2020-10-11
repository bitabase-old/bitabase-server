const righto = require('righto');
const callarestJson = require('callarest/json');

const reset = require('../helpers/reset');
const createServer = require('../../server');
const rightoTest = require('../helpers/rightoTest');

rightoTest('update a record returns new record', function * (t) {
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
    method: 'put',
    body: {
      test1: 'second'
    }
  });

  t.equal(testUpdate.response.statusCode, 200);
  t.equal(testUpdate.body.test1, 'second');
  t.notOk(testUpdate.body.test2);

  yield righto(server.stop);
});

rightoTest('get updated record', function * (t) {
  t.plan(2);

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
      test1: 'first'
    }
  });

  yield righto(callarestJson, {
    url: 'http://localhost:8000/v1/databases/test/records/example/' + testInsert.body.id,
    method: 'put',
    body: {
      test1: 'second'
    }
  });

  const testRead = yield righto(callarestJson, {
    url: 'http://localhost:8000/v1/databases/test/records/example/' + testInsert.body.id
  });

  t.equal(testRead.response.statusCode, 200);
  t.equal(testRead.body.test1, 'second');

  yield righto(server.stop);
});
