const righto = require('righto');
const callarestJson = require('callarest/json');

const reset = require('../helpers/reset');
const createServer = require('../../server');
const rightoTest = require('../helpers/rightoTest');

rightoTest('create item in collection with validation error on name', function * (t) {
  t.plan(2);

  yield righto(reset);
  const server = createServer();
  yield righto(server.start);

  const rest = yield righto(callarestJson, {
    url: 'http://localhost:8000/v1/databases/te-st/collections',
    method: 'post',
    data: {
      name: 'te-£$%st',
      schema: {
        testString: ['string']
      }
    }
  });

  yield righto(server.stop);

  t.equal(rest.response.statusCode, 400);
  t.deepEqual(rest.body, {
    name: 'can only be alpha numeric'
  });
});

rightoTest('create item in collection with built in validation error', function * (t) {
  t.plan(2);

  yield righto(reset);
  const server = createServer();
  yield righto(server.start);

  yield righto(callarestJson, {
    url: 'http://localhost:8000/v1/databases/te-st/collections',
    method: 'post',
    data: {
      name: 'te-st',
      schema: {
        testString: ['string'],
        testRequired: ['required'],
        testRequiredAgain: ['required']
      }
    }
  });

  const rest = yield righto(callarestJson, {
    url: 'http://localhost:8000/v1/databases/te-st/records/te-st',
    method: 'post',
    data: {
      testString: 10,
      testRequired: ''
    }
  });

  yield righto(server.stop);

  t.equal(rest.response.statusCode, 400);
  t.deepEqual(rest.body, {
    testString: ['must be string'],
    testRequired: ['required'],
    testRequiredAgain: ['required']
  });
});

rightoTest('create item in collection without using all fields', function * (t) {
  t.plan(3);

  yield righto(reset);
  const server = createServer();
  yield righto(server.start);

  yield righto(callarestJson, {
    url: 'http://localhost:8000/v1/databases/test/collections',
    method: 'post',
    data: {
      name: 'test',
      schema: {
        testOptionalOne: ['string'],
        testOptionalTwo: ['string']
      }
    }
  });

  const rest = yield righto(callarestJson, {
    url: 'http://localhost:8000/v1/databases/test/records/test',
    method: 'post',
    data: {
      testOptionalOne: 'test'
    }
  });

  yield righto(server.stop);

  t.equal(rest.response.statusCode, 201);
  t.ok(rest.body.id);
  t.equal(rest.body.testOptionalOne, 'test');
});

rightoTest('create item in collection with custom validation error', function * (t) {
  t.plan(2);
  yield righto(reset);

  const server = createServer();
  yield righto(server.start);

  // Create test collection with validation
  yield righto(callarestJson, {
    url: 'http://localhost:8000/v1/databases/test/collections',
    method: 'post',
    data: {
      name: 'test',
      schema: {
        test: ['required', 'string', 'value == "something" ? null : "must be something"']
      }
    }
  });

  // Make request
  const response = yield righto(callarestJson, {
    url: 'http://localhost:8000/v1/databases/test/records/test',
    method: 'post',
    data: {
      test: 'test1'
    }
  });

  yield righto(server.stop);

  t.equal(response.response.statusCode, 400);
  t.deepEqual(response.body, {
    test: ['must be something']
  });
});

rightoTest('create item in collection with customer presenter', function * (t) {
  t.plan(5);

  yield righto(reset);
  const server = createServer();
  yield righto(server.start);

  yield righto(callarestJson, {
    url: 'http://localhost:8000/v1/databases/test/collections',
    method: 'post',
    data: {
      name: 'test',
      schema: {
        test: ['required', 'string'],
        testToRemove: ['required', 'string']
      },
      presenters: [
        '{...record delete testToRemove}'
      ]
    }
  });

  // Make request
  const response = yield righto(callarestJson, {
    url: 'http://localhost:8000/v1/databases/test/records/test',
    method: 'post',
    data: {
      test: 'test1',
      testToRemove: 'be_gone'
    }
  });

  // Find record
  const found = yield righto(callarestJson, {
    url: `http://localhost:8000/v1/databases/test/records/test/${response.body.id}`
  });

  yield righto(server.stop);

  t.equal(response.response.statusCode, 201);
  t.equal(response.body.test, 'test1');
  t.notOk(response.body.testToRemove);
  t.ok(response.body.id);

  t.notOk(found.body.testToRemove);
});

rightoTest('create item in collection with customer transform', function * (t) {
  t.plan(4);

  yield righto(reset);
  const server = createServer();
  yield righto(server.start);

  yield righto(callarestJson, {
    url: 'http://localhost:8000/v1/databases/test/collections',
    method: 'post',
    data: {
      name: 'test',
      schema: {
        test: ['required', 'string']
      },
      transducers: [
        '{...body test: concat(body.test "-changed")}'
      ]
    }
  });

  const response = yield righto(callarestJson, {
    url: 'http://localhost:8000/v1/databases/test/records/test',
    method: 'post',
    data: {
      test: 'test1'
    }
  });

  t.equal(response.response.statusCode, 201);
  t.equal(response.body.test, 'test1-changed');
  t.ok(response.body.id);

  const found = yield righto(callarestJson, {
    url: `http://localhost:8000/v1/databases/test/records/test/${response.body.id}`
  });

  t.equal(found.body.test, 'test1-changed');

  yield righto(server.stop);
});

rightoTest('create new collection', function * (t) {
  t.plan(1);

  yield righto(reset);
  const server = createServer();
  yield righto(server.start);

  const response = yield righto(callarestJson, {
    url: 'http://localhost:8000/v1/databases/test/collections',
    method: 'post',
    data: {
      name: 'users',

      // Creating and updating items must conform to this schema
      schema: {
        username: ['required', 'string'],
        password: ['required', 'string'],
        permissions: ['required', 'array']
      },

      // These will be run on each record before presenting back to the client
      presenters: [],

      // These will be run on each record before saving to the database
      transducers: [
        '{...body password: hashText(body.password)}'
      ]
    }
  });

  t.equal(response.response.statusCode, 201);

  yield righto(server.stop);
});

rightoTest('create new collection -> duplicate collectionName', function * (t) {
  t.plan(2);

  yield righto(reset);
  const server = createServer();
  yield righto(server.start);

  yield righto(callarestJson, {
    url: 'http://localhost:8000/v1/databases/test/collections',
    method: 'post',
    data: {
      name: 'newcollection',
      schema: {}
    }
  });

  const response = yield righto(callarestJson, {
    url: 'http://localhost:8000/v1/databases/test/collections',
    method: 'post',
    data: {
      name: 'newcollection',
      schema: {}
    }
  });

  t.equal(response.response.statusCode, 422);
  t.deepEqual(response.body, { name: 'already taken' });

  yield righto(server.stop);
});
