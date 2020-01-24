const builder = require('mongo-sql');
const createMatchFieldNames = collectionName => new RegExp(`"_${collectionName}"\\."(.*?)"`, 'g');

function orderToMongo (collectionName, order) {
  if (!order) {
    return null;
  }

  const matcher = /(desc|asc)\((.*?)\)/g;
  const orders = [...order.matchAll(matcher)]
    .map(field => {
      const fieldName = field[2];
      const fieldDirection = field[1];

      return `"_${collectionName}"."${fieldName}" ${fieldDirection}`;
    });

  return orders;
}

function jsonifySqlQuery (sql, matchFieldNames) {
  const built = builder.sql(sql);

  built.query = built.query
    .replace(matchFieldNames, function (_, fieldName) {
      return `json_extract(data, "$.${fieldName}")`;
    });

  return built;
}

function queryStringToSqlRecords (collectionName, url, type) {
  const parsedUrl = (new URL(url));
  let query = parsedUrl.searchParams.get('query');
  query = JSON.parse(query);

  const order = parsedUrl.searchParams.get('order');

  const usersQuery = {
    type: type || 'select',
    table: `_${collectionName}`,
    where: query,
    limit: parseInt(parsedUrl.searchParams.get('limit') || 10),
    offset: parseInt(parsedUrl.searchParams.get('offset') || 0),
    order: orderToMongo(collectionName, order)
  };

  const matchFieldNames = createMatchFieldNames(collectionName);

  const result = jsonifySqlQuery(usersQuery, matchFieldNames);

  return result;
}

function queryStringToSqlCount (collectionName, url) {
  const parsedUrl = (new URL(url));
  let query = parsedUrl.searchParams.get('query');
  query = JSON.parse(query);

  const usersQuery = {
    type: 'select',
    columns: ['count(*)'],
    table: `_${collectionName}`,
    where: query
  };

  const matchFieldNames = createMatchFieldNames(collectionName);

  const result = jsonifySqlQuery(usersQuery, matchFieldNames);

  return result;
}

module.exports = {
  orderToMongo,
  count: queryStringToSqlCount,
  records: queryStringToSqlRecords
};
