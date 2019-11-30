const test = require('tape');
const validateDataAgainstSchema = require('../../modules/validateDataAgainstSchema');

test('validateDataAgainstSchema -> with no schema', (t) => {
  t.plan(2);

  function done (error, result) {
    t.notOk(error);
    t.ok(result);
  }

  // schema, field, scope
  validateDataAgainstSchema({}, {
    body: {
      a: 1
    }
  }, done);
});

test('validateDataAgainstSchema -> syntax error', (t) => {
  t.plan(2);

  function done (error, result) {
    t.equal(error.error.code, 'SCRIPT_EVALUATE_RUNTIME');
    t.notOk(result, 'result was not passed');
  }

  validateDataAgainstSchema({
    schema: {
      firstName: ['{......WHOOPS..}']
    }
  }, {
    headers: {},
    body: {
      firstName: 'bob'
    }
  }, done);
});

test('validateDataAgainstSchema -> return validation failure', (t) => {
  t.plan(2);

  function done (error, result) {
    t.notOk(result);
    t.deepEqual(error.friendly.firstName, ['no thanks'], ['validation errors were returned']);
  }

  validateDataAgainstSchema({
    schema: {
      firstName: ['"no thanks"']
    }
  }, {
    headers: {},
    body: {
      firstName: 'bob'
    }
  }, done);
});
