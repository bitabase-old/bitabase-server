const querystring = require('querystring');
const test = require('tape');

const queryStringToSql = require('../../modules/queryStringToSql');

test('simple query', t => {
  t.plan(2);

  const url = new URL('https://api.bitabase.net/people');
  url.search = querystring.stringify({
    query: JSON.stringify({ firstName: 'Joe' })
  });

  const sql = queryStringToSql.records('users', url.toString());
  t.equal(sql.query, 'select "_users".* from "_users" where json_extract(data, "$.firstName") = $1 limit $2');
  t.deepEqual(sql.values, ['Joe', 10]);
});

test('simple count query', t => {
  t.plan(2);

  const url = new URL('https://api.bitabase.net/people');
  url.search = querystring.stringify({
    query: JSON.stringify({ firstName: 'Joe' })
  });

  const sql = queryStringToSql.count('users', url.toString());
  t.equal(sql.query, 'select count(*) from "_users" where json_extract(data, "$.firstName") = $1');
  t.deepEqual(sql.values, ['Joe']);
});

test('danger', t => {
  t.plan(2);

  const url = new URL('https://api.bitabase.net/people');
  url.search = querystring.stringify({
    query: JSON.stringify({
      'firstName" = "a': 'Joe'
    })
  });

  const sql = queryStringToSql.records('users', url.toString());
  t.equal(sql.query, 'select "_users".* from "_users" where json_extract(data, "$.firstName = a") = $1 limit $2');
  t.deepEqual(sql.values, ['Joe', 10]);
});
