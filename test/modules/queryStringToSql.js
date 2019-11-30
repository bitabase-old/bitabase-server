const querystring = require('querystring');
const test = require('tape');

const queryStringToSql = require('../../modules/queryStringToSql');

test('orderToMongo', t => {
  t.plan(1);

  const parsedUrl = (new URL('http://www.example.com/people?order=desc(id),asc(date_created)'));
  const order = parsedUrl.searchParams.get('order');
  const parsedOrder = queryStringToSql.orderToMongo(order);

  t.deepEqual(parsedOrder, ['json_extract(data, "$.id") desc', 'json_extract(data, "$.date_created") asc']);
});

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
