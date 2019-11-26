const test = require('tape');
const httpRequest = require('../helpers/httpRequest');
const reset = require('../helpers/reset');
const createServer = require('../../server');

test('headers are available in transformations', async t => {
  t.plan(2);
  await reset();

  const server = await createServer().start();

  await httpRequest('/v1/databases/test/collections', {
    method: 'post',
    data: {
      name: 'users',
      schema: {
        test: ['required', 'string']
      },
      transforms: [
        '{...body test: headers["x-test-headers"]}'
      ]
    }
  });

  const testInsert = await httpRequest('/v1/databases/test/records/users', {
    headers: {
      'x-test-headers': 'test-header-value'
    },
    method: 'post',
    data: {
      test: 'yes'
    }
  });

  t.equal(testInsert.status, 201);
  t.equal(testInsert.data.test, 'test-header-value');

  await server.stop();
});

test('headers are available in presenters', async t => {
  t.plan(2);
  await reset();

  const server = await createServer().start();

  await httpRequest('/v1/databases/test/collections', {
    method: 'post',
    data: {
      name: 'users',
      schema: {
        test: ['required', 'string']
      },
      presenters: [
        '{...record test: headers["x-test-headers"]}'
      ]
    }
  });

  const testInsert = await httpRequest('/v1/databases/test/records/users', {
    headers: {
      'x-test-headers': 'test-header-value'
    },
    method: 'post',
    data: {
      test: 'yes'
    }
  });

  t.equal(testInsert.status, 201);
  t.equal(testInsert.data.test, 'test-header-value');

  await server.stop();
});

test('only x- headers are allowed', async t => {
  t.plan(2);
  await reset();

  const server = await createServer().start();

  await httpRequest('/v1/databases/test/collections', {
    method: 'post',
    data: {
      name: 'users',
      schema: {
        test: ['required', 'string']
      },
      presenters: [
        '{...record test: headers["no-thanks"]}'
      ]
    }
  });

  const testInsert = await httpRequest('/v1/databases/test/records/users', {
    headers: {
      'x-test-headers': 'test-header-value',
      'no-thanks': 'no-no-no'
    },
    method: 'post',
    data: {
      test: 'yes'
    }
  });

  t.equal(testInsert.status, 201);
  t.notOk(testInsert.data.test);

  await server.stop();
});

test('transformations run before schema validations', async t => {
  t.plan(2);
  await reset();

  const server = await createServer().start();

  await httpRequest('/v1/databases/test/collections', {
    method: 'post',
    data: {
      name: 'users',
      schema: {
        test: ['required', 'string']
      },
      transforms: [
        '{...body test: "text"}'
      ]
    }
  });

  const testInsert = await httpRequest('/v1/databases/test/records/users', {
    headers: {
      'x-test-headers': 'test-header-value'
    },
    method: 'post',
    data: {
      test: 1
    }
  });

  t.equal(testInsert.status, 201);
  t.equal(testInsert.data.test, 'text');

  await server.stop();
});
