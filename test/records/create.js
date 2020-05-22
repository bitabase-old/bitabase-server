const righto = require('righto');
const callarestJson = require('callarest/json');

const reset = require('../helpers/reset');
const createServer = require('../../server');
const rightoTest = require('../helpers/rightoTest');

rightoTest('headers are available in transformations', function * (t) {
  t.plan(2);

  yield righto(reset);
  const server = createServer();
  yield righto(server.start);

  yield righto(callarestJson, {
    url: 'http://localhost:8000/v1/databases/test/collections',
    method: 'post',
    body: {
      name: 'users',
      schema: {
        test: ['required', 'string']
      },
      transducers: [
        '{...body test: headers["x-test-headers"]}'
      ]
    }
  });

  const testInsert = yield righto(callarestJson, {
    url: 'http://localhost:8000/v1/databases/test/records/users',
    headers: {
      'x-test-headers': 'test-header-value'
    },
    method: 'post',
    body: {
      test: 'yes'
    }
  });

  t.equal(testInsert.response.statusCode, 201);
  t.equal(testInsert.body.test, 'test-header-value');

  yield righto(server.stop);
});

rightoTest('headers are available in presenters', function * (t) {
  t.plan(2);

  yield righto(reset);
  const server = createServer();
  yield righto(server.start);

  yield righto(callarestJson, {
    url: 'http://localhost:8000/v1/databases/test/collections',
    method: 'post',
    body: {
      name: 'users',
      schema: {
        test: ['required', 'string']
      },
      presenters: [
        '{...record test: headers["x-test-headers"]}'
      ]
    }
  });

  const testInsert = yield righto(callarestJson, {
    url: 'http://localhost:8000/v1/databases/test/records/users',
    headers: {
      'x-test-headers': 'test-header-value'
    },
    method: 'post',
    body: {
      test: 'yes'
    }
  });

  t.equal(testInsert.response.statusCode, 201);
  t.equal(testInsert.body.test, 'test-header-value');

  yield righto(server.stop);
});

rightoTest('only x- headers are allowed', function * (t) {
  t.plan(2);

  yield righto(reset);
  const server = createServer();
  yield righto(server.start);

  yield righto(callarestJson, {
    url: 'http://localhost:8000/v1/databases/test/collections',
    method: 'post',
    body: {
      name: 'users',
      schema: {
        test: ['required', 'string']
      },
      presenters: [
        '{...record test: headers["no-thanks"]}'
      ]
    }
  });

  const testInsert = yield righto(callarestJson, {
    url: 'http://localhost:8000/v1/databases/test/records/users',
    headers: {
      'x-test-headers': 'test-header-value',
      'no-thanks': 'no-no-no'
    },
    method: 'post',
    body: {
      test: 'yes'
    }
  });

  t.equal(testInsert.response.statusCode, 201);
  t.notOk(testInsert.body.test);

  yield righto(server.stop);
});

rightoTest('validation failure -> unknown column', function * (t) {
  t.plan(2);

  yield righto(reset);
  const server = createServer();
  yield righto(server.start);

  yield righto(callarestJson, {
    url: 'http://localhost:8000/v1/databases/test/collections',
    method: 'post',
    body: {
      name: 'test',
      schema: {
        knownColumn: ['required', 'string']
      }
    }
  });

  const testInsert = yield righto(callarestJson, {
    url: 'http://localhost:8000/v1/databases/test/records/test',
    method: 'post',
    body: {
      knownColumn: 'test',
      unknownColumn: 'yes'
    }
  });

  t.equal(testInsert.response.statusCode, 400);
  t.equal(testInsert.body.unknownColumn, 'unknown column');

  yield righto(server.stop);
});

rightoTest('create record -> with no schema', function * (t) {
  t.plan(2);

  yield righto(reset);
  const server = createServer();
  yield righto(server.start);

  yield righto(callarestJson, {
    url: 'http://localhost:8000/v1/databases/test/collections',
    method: 'post',
    body: {
      name: 'test'
    }
  });

  const testInsert = yield righto(callarestJson, {
    url: 'http://localhost:8000/v1/databases/test/records/test',
    method: 'post',
    body: {
      unknownColumn: 'yes'
    }
  });

  t.equal(testInsert.response.statusCode, 201);
  t.equal(testInsert.body.unknownColumn, 'yes');

  yield righto(server.stop);
});

rightoTest('test inbuild schema field types', function * (t) {
  t.plan(4);

  yield righto(reset);
  const server = createServer();
  yield righto(server.start);

  yield righto(callarestJson, {
    url: 'http://localhost:8000/v1/databases/test/collections',
    method: 'post',
    body: {
      name: 'test',
      schema: {
        testString: ['required', 'string'],
        testNumber: ['required', 'number'],
        testArray: ['required', 'array']
      }
    }
  });

  const testInsert = yield righto(callarestJson, {
    url: 'http://localhost:8000/v1/databases/test/records/test',
    method: 'post',
    body: {
      testString: 'onetwothree',
      testNumber: 123,
      testArray: [1, 2, 3]
    }
  });

  t.equal(testInsert.response.statusCode, 201);
  t.equal(testInsert.body.testString, 'onetwothree');
  t.equal(testInsert.body.testNumber, 123);
  t.deepEqual(testInsert.body.testArray, [1, 2, 3]);

  yield righto(server.stop);
});

rightoTest('test inbuild schema field types when wrong', function * (t) {
  t.plan(4);

  yield righto(reset);
  const server = createServer();
  yield righto(server.start);

  yield righto(callarestJson, {
    url: 'http://localhost:8000/v1/databases/test/collections',
    method: 'post',
    body: {
      name: 'test',
      schema: {
        testString: ['required', 'string'],
        testNumber: ['required', 'number'],
        testArray: ['required', 'array']
      }
    }
  });

  const testInsert = yield righto(callarestJson, {
    url: 'http://localhost:8000/v1/databases/test/records/test',
    method: 'post',
    body: {
      testString: 123,
      testNumber: 'stirng',
      testArray: 'notarray'
    }
  });

  t.equal(testInsert.response.statusCode, 400);
  t.deepEqual(testInsert.body.testString, ['must be string']);
  t.deepEqual(testInsert.body.testNumber, ['must be number']);
  t.deepEqual(testInsert.body.testArray, ['must be array']);

  yield righto(server.stop);
});

rightoTest('test inbuild schema field types when null', function * (t) {
  t.plan(1);

  yield righto(reset);
  const server = createServer();
  yield righto(server.start);

  yield righto(callarestJson, {
    url: 'http://localhost:8000/v1/databases/test/collections',
    method: 'post',
    body: {
      name: 'test',
      schema: {
        always: ['string'],
        testString: ['string'],
        testNumber: ['number'],
        testArray: ['array']
      }
    }
  });

  const testInsert = yield righto(callarestJson, {
    url: 'http://localhost:8000/v1/databases/test/records/test',
    method: 'post',
    body: {
      always: 'a',
      testString: null,
      testNumber: null,
      testArray: null
    }
  });

  t.equal(testInsert.response.statusCode, 201);

  yield righto(server.stop);
});
