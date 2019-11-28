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

test('applyTransducersToData - ordered', (t) => {
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
