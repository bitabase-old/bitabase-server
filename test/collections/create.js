const test = require('tape');
const httpRequest = require('../helpers/httpRequest');
const reset = require('../helpers/reset');
const createServer = require('../../server');

async function createTestCollection () {
  await httpRequest('/v1/databases/test/collections', {
    method: 'post',
    data: {
      name: 'test',
      schema: {
        test: ['required', 'string']
      }
    }
  });
}

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

  t.equal(response.status, 400);
  t.deepEqual(response.data, {
    testString: ['must be string'],
    testRequired: ['required'],
    testRequiredAgain: ['required']
  });

  await server.stop();
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

  t.equal(response.status, 201);
  t.ok(response.data.id);
  t.equal(response.data.testOptionalOne, 'test');

  await server.stop();
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

  t.equal(response.status, 400);
  t.deepEqual(response.data, {
    test: ['must be something']
  });

  await server.stop();
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
        '{testToRemove: undefined}'
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

  t.equal(response.status, 201);
  t.equal(response.data.test, 'test1');
  t.notOk(response.data.testToRemove);
  t.ok(response.data.id);

  // Find record
  const found = await httpRequest(
    `/v1/databases/test/collections/test/records/${response.data.id}`
  );

  t.notOk(found.data.testToRemove);

  await server.stop();
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
        '{test: concat(data.test "-changed")}'
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
