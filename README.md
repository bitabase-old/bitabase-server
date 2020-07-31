# bitabase - Server
[![Build Status](https://travis-ci.org/bitabase/bitabase-server.svg?branch=master)](https://travis-ci.org/bitabase/bitabase-server)
[![David DM](https://david-dm.org/bitabase/bitabase-server.svg)](https://david-dm.org/bitabase/bitabase-server)
![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/bitabase/bitabase-server)
[![GitHub package.json version](https://img.shields.io/github/package-json/v/bitabase/bitabase-server)](https://github.com/bitabase/bitabase-server/blob/master/package.json)
[![GitHub](https://img.shields.io/github/license/bitabase/bitabase-server)](https://github.com/bitabase/bitabase-server/blob/master/LICENSE)
[![js-semistandard-style](https://img.shields.io/badge/code%20style-semistandard-brightgreen.svg?style=flat-square)](https://github.com/standard/semistandard)

This is a very early attempt at the bitabase rest server.

## Getting Started
### From the CLI
Running the following:
```bash
npm install --global bitabase-server
bitabase-server --help
```

Will output the below:
```bash
📦 Bitabase-Server - v1.15.1
The scalable, sharded database engine.
https://docs.bitabase.com

The following commands and arguments are available when starting Bitabase

Commands:
  start                            Start the bitabase server stack
    --bind-host                    Hostname to bind server to (default: 0.0.0.0)
    --bind-port                    Port to bind server to (default: 8000)
    --rqlite-addr                  Path to contact rqlite
    --database-path                Where to store rqlite transaction log (default: /tmp/sqlite-bitabase)
    --database-keep-alive          How long to keep sqlite database connections alive

No command specified
```

You can start a bitabase server by running:

```bash
bitabase-server start
```

### From NodeJS
```javascript
const bitabaseServer = require('bitabase-server/server');

const server = bitabaseServer({
  bindHost: '0.0.0.0'
});

server.start();
```

## Endpoints

<table>
  <tr>
    <th></th>
    <th>Method</th>
    <th>Path</th>
    <th>Description</th>
  </tr>
  <tr>
    <td colspan=4>
      <strong>Collections</strong></br>
      Collections are groups of records that belong to a database
    </td>
  </tr>
  <tr>
    <td><a href="https://www.github.com/bitabase/bitabase-manager">1.1</a></td>
    <td>POST</td>
    <td>/v1/databases/:databaseName/collections</td>
    <td>Create a new collection</td>
  </tr>
  <tr>
    <td><a href="https://www.github.com/bitabase/bitabase-manager">1.2</a></td>
    <td>GET</td>
    <td>/v1/databases/:databaseName/collections</td>
    <td>List all collections</td>
  </tr>
  <tr>
    <td><a href="https://www.github.com/bitabase/bitabase-manager">1.3</a></td>
    <td>GET</td>
    <td>/v1/databases/:databaseName/collections/:collectionName</td>
    <td>Read a specific collections</td>
  </tr>
  <tr>
    <td><a href="https://www.github.com/bitabase/bitabase-manager">1.4</a></td>
    <td>PUT</td>
    <td>/v1/databases/:databaseName/collections/:collectionName</td>
    <td>Update a collection schema</td>
  </tr>
  <tr>
    <td colspan=4>
      <strong>Records</strong></br>
      Records are stored in a collection and must adhere to the schema
    </td>
  </tr>
  <tr>
    <td><a href="https://www.github.com/bitabase/bitabase-manager">2.1</a></td>
    <td>POST</td>
    <td>/v1/databases/:databaseName/records/:collectionName</td>
    <td>Create a new record</td>
  </tr>
  <tr>
    <td><a href="https://www.github.com/bitabase/bitabase-manager">2.2</a></td>
    <td>GET</td>
    <td>/v1/databases/:databaseName/records/:collectionName?query={}</td>
    <td>Search through records</td>
  </tr>
  <tr>
    <td><a href="https://www.github.com/bitabase/bitabase-manager">2.3</a></td>
    <td>DELETE</td>
    <td>/v1/databases/:databaseName/records/:collectionName?query={}</td>
    <td>Delete queried records</td>
  </tr>
  <tr>
    <td><a href="https://www.github.com/bitabase/bitabase-manager">2.4</a></td>
    <td>GET</td>
    <td>/v1/databases/:databaseName/records/:collectionName/:recordId</td>
    <td>Get a specific record</td>
  </tr>
  <tr>
    <td><a href="https://www.github.com/bitabase/bitabase-manager">2.5</a></td>
    <td>PUT</td>
    <td>/v1/databases/:databaseName/records/:collectionName/:recordId</td>
    <td>Update a specific record</td>
  </tr>
  <tr>
    <td><a href="https://www.github.com/bitabase/bitabase-manager">2.5</a></td>
    <td>PATCH</td>
    <td>/v1/databases/:databaseName/records/:collectionName/:recordId</td>
    <td>Partially update a specific record</td>
  </tr>
  <tr>
    <td><a href="https://www.github.com/bitabase/bitabase-manager">2.6</a></td>
    <td>DELETE</td>
    <td>/v1/databases/:databaseName/records/:collectionName/:recordId</td>
    <td>Delete a specific record</td>
  </tr>
  <tr>
    <td colspan=4>
      <strong>Logs</strong></br>
      When a record method fails a log will be stored containing information on the failure
    </td>
  </tr>
  <tr>
    <td><a href="https://www.github.com/bitabase/bitabase-manager">3.1</a></td>
    <td>GET</td>
    <td>/v1/databases/:databaseName/logs/:collectionName</td>
    <td>Search through logs</td>
  </tr>
</table>

## License
This project is licensed under the terms of the AGPL-3.0 license.
