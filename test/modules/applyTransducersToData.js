const test = require('tape');
const applyTransducersToData = require('../../modules/applyTransducersToData');

test('applyTransducersToData -> with no transducers', (t) => {
  t.plan(2);

  function done (error, result) {
    t.notOk(error);
    t.ok(result);
  }

  applyTransducersToData({}, {
    body: {
      a: 1
    }
  }, done);
});

test('applyTransducersToData -> ordered', (t) => {
  t.plan(2);

  function done (error, result) {
    t.notOk(error);
    t.equal(result.a, 16);
  }

  applyTransducersToData({
    transducers: [
      '{...body a: body.a + 5}',
      '{...body a: body.a + 5}',
      '{...body a: body.a + 5}'
    ]
  }, {
    headers: {},
    body: {
      a: 1
    }
  }, done);
});

test('applyTransducersToData -> syntax error', (t) => {
  t.plan(2);

  function done (error, result) {
    t.equal(error.error.code, 'SCRIPT_EVALUATE_RUNTIME');
    t.notOk(result, 'result was not passed');
  }

  applyTransducersToData({
    transducers: [
      '{......WHOOPS..}'
    ]
  }, {
    headers: {},
    body: {
      a: 1
    }
  }, done);
});

test('applyTransducersToData -> returns none object', (t) => {
  t.plan(6);

  function done (error, result) {
    t.equal(error.script, '"Hello there"');
    t.equal(error.scope.body.a, 1);
    t.equal(error.returned, 'Hello there');
    t.equal(error.error.code, 'SCRIPT_EVALUATE_RUNTIME');
    t.equal(error.error.message, 'transducer did not return an object');
    t.notOk(result, 'result was not passed');
  }

  applyTransducersToData({
    transducers: [
      '"Hello there"'
    ]
  }, {
    headers: {},
    body: {
      a: 1
    }
  }, done);
});
