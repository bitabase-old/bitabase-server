const test = require('tape');
const httpRequest = require('../helpers/httpRequest');
const reset = require('../helpers/reset');
const createServer = require('../../server');

async function createTestCollection () {
  return httpRequest('/v1/databases/test/collections', {
    method: 'post',
    data: {
      name: 'test',
      schema: {
        test: ['required', 'string']
      }
    }
  });
}

test('collections.update: no schema returns validate error', async t => {
  t.plan(2);
  await reset();

  const server = await createServer().start();

  const collection = await createTestCollection();

  const response = await httpRequest(`/v1/databases/test/collections/${collection.data.name}`, {
    method: 'put',
    data: {
      name: 'test'
    }
  });

  await server.stop();

  t.equal(response.status, 400);
  t.deepEqual(response.data, { schema: 'required' });
});

test('collections.update: update a collection', async t => {
  t.plan(2);

  await reset();

  const server = await createServer().start();

  await httpRequest('/v1/databases/test/collections', {
    method: 'post',
    data: {
      name: 'test',
      schema: {}
    }
  });

  const addFieldsResponse = await httpRequest('/v1/databases/test/collections/test', {
    method: 'put',
    data: {
      name: 'test',

      schema: {
        newfield1: ['required', 'string'],
        newfield2: ['required', 'string']
      }
    },
    validateStatus: status => status < 500
  });

  t.equal(addFieldsResponse.status, 200);

  const removeFieldResponse = await httpRequest('/v1/databases/test/collections/test', {
    method: 'put',
    data: {
      name: 'test',

      schema: {
        newfield1: ['required', 'string']
      }
    },
    validateStatus: status => status < 500
  });

  await server.stop();

  t.equal(removeFieldResponse.status, 200);
});

test('collections.update: add fields to collection', async t => {
  t.plan(2);
  await reset();

  const server = await createServer().start();

  const collection = await createTestCollection();

  const createResponse = await httpRequest(`/v1/databases/test/collections/${collection.data.name}`, {
    method: 'put',
    data: {
      name: 'test',
      schema: {
        test: ['required', 'string']
      }
    }
  });

  const validateResponse = await httpRequest(`/v1/databases/test/collections/${collection.data.name}`);
  await server.stop();

  t.equal(createResponse.status, 200);
  t.deepEqual(validateResponse.data, {
    id: 'test',
    name: 'test',
    schema: { test: ['required', 'string'] }
  });
});
