const connect = require('../../modules/db');

module.exports = async function (req, res, params) {
  const db = await connect('test.db');

  await db.runIgnore('CREATE TABLE lorem (info TEXT)');

  const stmt = db.prepare('INSERT INTO lorem VALUES (?)');
  for (let i = 0; i < 10; i++) {
    stmt.run('Ipsum ' + i);
  }
  await stmt.finalize();

  const rows = await db.all('SELECT rowid AS id, info FROM lorem');
  console.log(rows);

  await db.close();

  res.end('{}');
};
