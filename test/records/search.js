const test = require('tape');
const querystring = require('querystring');
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

test('list items in collection when empty', async t => {
  t.plan(1);
  await reset();

  const server = await createServer().start();

  await createTestCollection();

  const response = await httpRequest('/v1/databases/test/records/test', {
    method: 'get'
  });

  t.deepEqual(response.data, {
    count: 0,
    items: []
  });

  await server.stop();
});

test('list items in collection with default pagination', async t => {
  t.plan(4);
  await reset();

  const server = await createServer().start();

  await createTestCollection();

  for (let i = 0; i < 100; i++) {
    await httpRequest('/v1/databases/test/records/test', {
      method: 'post',
      data: { test: 'testing' + i }
    });
  }

  const response = await httpRequest('/v1/databases/test/records/test', {
    method: 'get'
  });

  t.equal(response.status, 200);
  t.equal(response.data.count, 100);
  t.equal(response.data.items.length, 10);
  t.equal(response.data.items[0].test, 'testing0');

  await server.stop();
});

test('list items in collection with custom offset', async t => {
  t.plan(4);
  await reset();

  const server = await createServer().start();

  await createTestCollection();

  for (let i = 0; i < 100; i++) {
    await httpRequest('/v1/databases/test/records/test', {
      method: 'post',
      data: { test: 'testing' + i }
    });
  }

  const response = await httpRequest('/v1/databases/test/records/test?offset=10', {
    method: 'get'
  });

  t.equal(response.status, 200);
  t.equal(response.data.count, 100);
  t.equal(response.data.items.length, 10);
  t.equal(response.data.items[0].test, 'testing10');

  await server.stop();
});

test('list items in collection with query', async t => {
  t.plan(4);
  await reset();

  const server = await createServer().start();

  await createTestCollection();

  for (let i = 0; i < 100; i++) {
    await httpRequest('/v1/databases/test/records/test', {
      method: 'post',
      data: { test: 'testing' + i }
    });
  }

  const query = querystring.stringify({
    query: JSON.stringify({ test: 'testing51' })
  });

  const response = await httpRequest('/v1/databases/test/records/test?' + query, {
    method: 'get'
  });

  t.equal(response.status, 200);
  t.equal(response.data.count, 1);
  t.equal(response.data.items.length, 1);
  t.equal(response.data.items[0].test, 'testing51');

  await server.stop();
});

test('list items in collection with custom pagination', async t => {
  t.plan(4);
  await reset();

  const server = await createServer().start();

  await createTestCollection();

  for (let i = 0; i < 100; i++) {
    await httpRequest('/v1/databases/test/records/test', {
      method: 'post',
      data: { test: 'testing' + i }
    });
  }

  const response = await httpRequest('/v1/databases/test/records/test?limit=100', {
    method: 'get'
  });

  t.equal(response.status, 200);
  t.equal(response.data.count, 100);
  t.equal(response.data.items.length, 100);
  t.equal(response.data.items[20].test, 'testing20');

  await server.stop();
});

test('list items in collection with invalid query', async t => {
  t.plan(2);
  await reset();

  const server = await createServer().start();

  await createTestCollection();

  for (let i = 0; i < 100; i++) {
    await httpRequest('/v1/databases/test/records/test', {
      method: 'post',
      data: { test: 'testing' + i }
    });
  }

  const query = querystring.stringify({
    query: JSON.stringify({
      firstName: 'Joe'
    })
  });

  const response = await httpRequest('/v1/databases/test/records/test?' + query, {
    method: 'get'
  });

  t.equal(response.status, 400);

  t.deepEqual(response.data, { error: 'query filter on none existing field [firstName]' });

  await server.stop();
});
