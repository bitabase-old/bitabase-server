const builder = require('mongo-sql');

function queryStringToSqlWhere (collectionName, url) {
  const parsedUrl = (new URL(url));
  let query = parsedUrl.searchParams.get('query');
  query = JSON.parse(query);

  const usersQuery = {
    type: 'select',
    table: collectionName,
    where: query,
    limit: parseInt(parsedUrl.searchParams.get('limit') || 10),
    offset: parseInt(parsedUrl.searchParams.get('offset') || 0)
  };

  const result = builder.sql(usersQuery);

  return {
    query: result.toString(),
    values: result.values
  };
}

module.exports = queryStringToSqlWhere;
