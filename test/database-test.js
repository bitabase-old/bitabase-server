const test = require('tape');
const httpRequest = require('./helpers/httpRequest');
const reset = require('./helpers/reset');
const createServer = require('../server');

test('list collections: empty', async t => {
  t.plan(1);
  await reset();

  const server = await createServer().start();

  const response = await httpRequest('/v1/databases/test/collections', {
    method: 'get'
  });

  t.deepEqual(response.data, {
    count: 0,
    items: []
  });

  await server.stop();
});

test('list collections: one db', async t => {
  t.plan(1);
  await reset();

  const server = await createServer().start();

  // Create a collection
  await httpRequest('/v1/databases/test/collections', {
    method: 'post',
    data: {
      name: 'test',

      // Creating and updating items must conform to this schema
      schema: {
        test: ['required', 'string']
      }
    }
  });

  // Create a record
  await httpRequest('/v1/databases/test/collections/test', {
    method: 'post',
    data: {
      test: 'onse'
    }
  });

  const response = await httpRequest('/v1/databases/test/collections', {
    method: 'get'
  });

  t.deepEqual(response.data, {
    count: 1,
    items: ['test']
  });

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
      presenters: [
        '{password: data.password}'
      ],

      // These will be run on each record before saving to the database
      mutations: [
        '{password: hashText(data.password)}'
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
