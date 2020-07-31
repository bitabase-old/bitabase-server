// const righto = require('righto');
// righto._debug = true;
// righto._autotraceOnError = true;

require('./modules/applyTransducersToData');
require('./modules/cachableSqlite');
require('./modules/queryStringToSql');
require('./modules/validateDataAgainstSchema');

require('./collections/create');
require('./collections/read');
require('./collections/search');
require('./collections/update');

require('./logs/search');

require('./records/create');
require('./records/read');
require('./records/update');
require('./records/patch');
require('./records/search');
require('./records/delete');
require('./records/deleteByQuery');

require('./authentication');
