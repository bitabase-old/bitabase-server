const righto = require('righto');
const callarestJson = require('callarest/json');

const reset = require('../helpers/reset');
const createServer = require('../../server');
const rightoTest = require('../helpers/rightoTest');

function createTestCollection (callback) {
  return callarestJson({
    url: 'http://localhost:8000/v1/databases/test/collections',
    method: 'post',
    data: {
      name: 'test',
      schema: {
        test: ['required', 'string']
      }
    }
  }, callback);
}

rightoTest('collections.update: update a collection', function * (t) {
  t.plan(2);

  yield righto(reset);
  const server = createServer();
  yield righto(server.start);

  yield righto(callarestJson, {
    url: 'http://localhost:8000/v1/databases/test/collections',
    method: 'post',
    data: {
      name: 'test',
      schema: {}
    }
  });

  const addFieldsRest = yield righto(callarestJson, {
    url: 'http://localhost:8000/v1/databases/test/collections/test',
    method: 'put',
    data: {
      name: 'test',

      schema: {
        newfield1: ['required', 'string'],
        newfield2: ['required', 'string']
      }
    }
  });

  t.equal(addFieldsRest.response.statusCode, 200);

  const removeFieldRest = yield righto(callarestJson, {
    url: 'http://localhost:8000/v1/databases/test/collections/test',
    method: 'put',
    data: {
      name: 'test',

      schema: {
        newfield1: ['required', 'string']
      }
    }
  });

  yield righto(server.stop);

  t.equal(removeFieldRest.response.statusCode, 200);
});

rightoTest('collections.update: add fields to collection', function * (t) {
  t.plan(2);

  yield righto(reset);
  const server = createServer();
  yield righto(server.start);

  const collection = yield righto(createTestCollection);

  const createRest = yield righto(callarestJson, {
    url: `http://localhost:8000/v1/databases/test/collections/${collection.body.name}`,
    method: 'put',
    data: {
      name: 'test',
      schema: {
        test: ['required', 'string']
      }
    }
  });

  const validateResponse = yield righto(callarestJson, {
    url: `http://localhost:8000/v1/databases/test/collections/${collection.body.name}`
  });
  yield righto(server.stop);

  t.equal(createRest.response.statusCode, 200);
  t.deepEqual(validateResponse.body, {
    id: 'test',
    name: 'test',
    schema: { test: ['required', 'string'] }
  });
});
