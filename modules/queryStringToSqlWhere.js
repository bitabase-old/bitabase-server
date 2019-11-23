const builder = require('mongo-sql');

function queryStringToSqlWhere (collectionName, url) {
  let query = (new URL(url)).searchParams.get('query');
  query = JSON.parse(query);

  const usersQuery = {
    type: 'select',
    table: collectionName,
    where: query
  };

  const result = builder.sql(usersQuery);

  return {
    query: result.toString(),
    values: result.values
  };
}

module.exports = queryStringToSqlWhere;
