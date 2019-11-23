const test = require('tape');
const httpRequest = require('../helpers/httpRequest');
const reset = require('../helpers/reset');
const createServer = require('../../server');

test('create item in collection with built in rule failures');

test('create item in collection with built in validation error', async t => {
  t.plan(2);
  await reset();

  const server = await createServer().start();

  // Create test collection with validation
  await httpRequest('/v1/databases/test/collections', {
    method: 'post',
    data: {
      name: 'test',
      schema: {
        testString: ['string'],
        testRequired: ['required'],
        testRequiredAgain: ['required']
      }
    }
  });

  // Make request
  const response = await httpRequest('/v1/databases/test/collections/test/records', {
    method: 'post',
    data: {
      testString: 10,
      testRequired: ''
    }
  });

  await server.stop();

  t.equal(response.status, 400);
  t.deepEqual(response.data, {
    testString: ['must be string'],
    testRequired: ['required'],
    testRequiredAgain: ['required']
  });
});

test('create item in collection without using all fields', async t => {
  t.plan(3);
  await reset();

  const server = await createServer().start();

  // Create test collection with validation
  await httpRequest('/v1/databases/test/collections', {
    method: 'post',
    data: {
      name: 'test',
      schema: {
        testOptionalOne: ['string'],
        testOptionalTwo: ['string']
      }
    }
  });

  // Make request
  const response = await httpRequest('/v1/databases/test/collections/test/records', {
    method: 'post',
    data: {
      testOptionalOne: 'test'
    }
  });

  await server.stop();

  t.equal(response.status, 201);
  t.ok(response.data.id);
  t.equal(response.data.testOptionalOne, 'test');
});

test('create item in collection with custom validation error', async t => {
  t.plan(2);
  await reset();

  const server = await createServer().start();

  // Create test collection with validation
  await httpRequest('/v1/databases/test/collections', {
    method: 'post',
    data: {
      name: 'test',
      schema: {
        test: ['required', 'string', 'value == "something" ? null : "must be something"']
      }
    }
  });

  // Make request
  const response = await httpRequest('/v1/databases/test/collections/test/records', {
    method: 'post',
    data: {
      test: 'test1'
    }
  });

  await server.stop();

  t.equal(response.status, 400);
  t.deepEqual(response.data, {
    test: ['must be something']
  });
});

test('create item in collection with customer presenter', async t => {
  t.plan(5);
  await reset();

  const server = await createServer().start();

  // Create test collection with validation
  await httpRequest('/v1/databases/test/collections', {
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
  const response = await httpRequest('/v1/databases/test/collections/test/records', {
    method: 'post',
    data: {
      test: 'test1',
      testToRemove: 'be_gone'
    }
  });

  // Find record
  const found = await httpRequest(
    `/v1/databases/test/collections/test/records/${response.data.id}`
  );

  await server.stop();

  t.equal(response.status, 201);
  t.equal(response.data.test, 'test1');
  t.notOk(response.data.testToRemove);
  t.ok(response.data.id);

  t.notOk(found.data.testToRemove);
});

test('create item in collection with customer mutation', async t => {
  t.plan(4);
  await reset();

  const server = await createServer().start();

  // Create test collection with validation
  await httpRequest('/v1/databases/test/collections', {
    method: 'post',
    data: {
      name: 'test',
      schema: {
        test: ['required', 'string']
      },
      mutations: [
        '{...body test: concat(body.test "-changed")}'
      ]
    }
  });

  // Make request
  const response = await httpRequest('/v1/databases/test/collections/test/records', {
    method: 'post',
    data: {
      test: 'test1'
    }
  });

  t.equal(response.status, 201);
  t.equal(response.data.test, 'test1-changed');
  t.ok(response.data.id);

  // Find record
  const found = await httpRequest(
    `/v1/databases/test/collections/test/records/${response.data.id}`
  );

  t.equal(found.data.test, 'test1-changed');

  await server.stop();
});

test('create new collection', async t => {
  t.plan(1);

  await reset();

  const server = await createServer().start();

  const response = await httpRequest('/v1/databases/test/collections', {
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
      mutations: [
        '{...body password: hashText(body.password)}'
      ],

      // You can also set rules for each method
      rules: {
        POST: [
          // Allow anyone to register, but only admins to add permissions
          'length(data.permissions) === 0 || includes("admin" user.permissions)'
        ],
        PUT: [
          'includes("admin" user.permissions)'
        ],
        PATCH: [
          'includes("admin" user.permissions)'
        ],
        DELETE: [
          '"can not delete people"'
        ]
      }
    },
    validateStatus: status => status < 500
  });

  t.equal(response.status, 201);

  await server.stop();
});

test('create new collection -> duplicate collectionName', async t => {
  t.plan(2);

  await reset();

  const server = await createServer().start();

  await httpRequest('/v1/databases/test/collections', {
    method: 'post',
    data: {
      name: 'newcollection',
      schema: {}
    },
    validateStatus: status => status < 500
  });

  const response = await httpRequest('/v1/databases/test/collections', {
    method: 'post',
    data: {
      name: 'newcollection',
      schema: {}
    },
    validateStatus: status => status < 500
  });

  t.equal(response.status, 422);
  t.deepEqual(response.data, { name: 'already taken' });

  await server.stop();
});
