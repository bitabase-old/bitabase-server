const builder = require('mongo-sql');

function jsonifySqlQuery (sql, matchFieldNames) {
  const built = builder.sql(sql);

  built.query = built.query
    .replace(matchFieldNames, function (_, fieldName) {
      return `json_extract(data, "$.${fieldName}")`;
    });

  return built;
}

function queryStringToSqlRecords (collectionName, url) {
  const parsedUrl = (new URL(url));
  let query = parsedUrl.searchParams.get('query');
  query = JSON.parse(query);

  const usersQuery = {
    type: 'select',
    table: `_${collectionName}`,
    where: query,
    limit: parseInt(parsedUrl.searchParams.get('limit') || 10),
    offset: parseInt(parsedUrl.searchParams.get('offset') || 0)
  };

  const matchFieldNames = new RegExp(`"_${collectionName}"."(.*)"`, 'g');

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

  const matchFieldNames = new RegExp(`"_${collectionName}"."(.*)"`, 'g');

  const result = jsonifySqlQuery(usersQuery, matchFieldNames);

  return result;
}

module.exports = {
  count: queryStringToSqlCount,
  records: queryStringToSqlRecords
};
