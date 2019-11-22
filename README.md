# bitabase - Server
[![Build Status](https://travis-ci.org/bitabase/bitabase-server.svg?branch=master)](https://travis-ci.org/bitabase/bitabase-server)
[![David DM](https://david-dm.org/bitabase/bitabase-server.svg)](https://david-dm.org/bitabase/bitabase-server)
![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/bitabase/bitabase-server)
[![GitHub package.json version](https://img.shields.io/github/package-json/v/bitabase/bitabase-server)](https://github.com/bitabase/bitabase-server/blob/master/package.json)
[![GitHub](https://img.shields.io/github/license/bitabase/bitabase-server)](https://github.com/bitabase/bitabase-server/blob/master/LICENSE)
[![js-semistandard-style](https://img.shields.io/badge/code%20style-semistandard-brightgreen.svg?style=flat-square)](https://github.com/standard/semistandard)

This is a very early attempt at the bitabase rest server.

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
    <td>/v1/databases/:name/collections</td>
    <td>Create a new collection</td>
  </tr>
  <tr>
    <td><a href="https://www.github.com/bitabase/bitabase-manager">1.2</a></td>
    <td>GET</td>
    <td>/v1/databases/:name/collections</td>
    <td>List all collections</td>
  </tr>
  <tr>
    <td><a href="https://www.github.com/bitabase/bitabase-manager">1.3</a></td>
    <td>GET</td>
    <td>/v1/databases/:name/collections/:name</td>
    <td>Read a specific collections</td>
  </tr>
  <tr>
    <td><a href="https://www.github.com/bitabase/bitabase-manager">1.4</a></td>
    <td>PUT</td>
    <td>/v1/databases/:name/collections/:name</td>
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
    <td>/v1/databases/:name/collections/:name/records</td>
    <td>Create a new record</td>
  </tr>
  <tr>
    <td><a href="https://www.github.com/bitabase/bitabase-manager">2.2</a></td>
    <td>GET</td>
    <td>/v1/databases/:name/collections/:name/records</td>
    <td>Search through records</td>
  </tr>
  <tr>
    <td><a href="https://www.github.com/bitabase/bitabase-manager">2.3</a></td>
    <td>GET</td>
    <td>/v1/databases/:name/collections/:name/records/:id</td>
    <td>Get a specific record</td>
  </tr>
</table>

## License
This project is licensed under the terms of the AGPL-3.0 license.
