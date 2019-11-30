const righto = require('righto');
const callarestJson = require('callarest/json');

const reset = require('../helpers/resetCB');
const createServer = require('../../server');
const rightoTest = require('../helpers/rightoTest');

rightoTest('list collections: empty', function * (t) {
  t.plan(1);

  yield righto(reset);
  const server = createServer();
  yield righto(server.start);

  const rest = yield righto(callarestJson, {
    url: 'http://localhost:8000/v1/databases/test/collections',
    method: 'get'
  });

  yield righto(server.stop);

  t.deepEqual(rest.body, {
    count: 0,
    items: []
  });
});

rightoTest('list collections: one db', function * (t) {
  t.plan(1);

  yield righto(reset);
  const server = createServer();
  yield righto(server.start);

  // Create a collection
  yield righto(callarestJson, {
    url: 'http://localhost:8000/v1/databases/test/collections',
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
  yield righto(callarestJson, {
    url: 'http://localhost:8000/v1/databases/test/collections/test',
    method: 'post',
    data: {
      test: 'onse'
    }
  });

  const rest = yield righto(callarestJson, {
    url: 'http://localhost:8000/v1/databases/test/collections',
    method: 'get'
  });

  yield righto(server.stop);

  t.deepEqual(rest.body, {
    count: 1,
    items: ['test']
  });
});
