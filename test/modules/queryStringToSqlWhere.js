const querystring = require('querystring');
const test = require('tape');

const queryStringToSqlWhere = require('../../modules/queryStringToSqlWhere');

test('simple query', t => {
  t.plan(2);

  const url = new URL('https://api.bitabase.net/people');
  url.search = querystring.stringify({
    query: JSON.stringify({ firstName: 'Joe' })
  });

  const sql = queryStringToSqlWhere('users', url.toString());
  t.equal(sql.query, 'select "users".* from "users" where "users"."firstName" = $1 limit $2');
  t.deepEqual(sql.values, ['Joe', 10]);
});

test('danger', t => {
  t.plan(2);

  const url = new URL('https://api.bitabase.net/people');
  url.search = querystring.stringify({
    query: JSON.stringify({
      'firstName" = "a': 'Joe'
    })
  });

  const sql = queryStringToSqlWhere('users', url.toString());
  t.equal(sql.query, 'select "users".* from "users" where "users"."firstName = a" = $1 limit $2');
  t.deepEqual(sql.values, ['Joe', 10]);
});
