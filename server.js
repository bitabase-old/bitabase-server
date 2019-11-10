const http = require('http')
const router = require('find-my-way')()
const config = require('./config')

router.on('GET', '/v1/databases/:databaseName/collections', require('./commands/collections/search.js'))
router.on('POST', '/v1/databases/:databaseName/collections', require('./commands/collections/create.js'))
router.on('PUT', '/v1/databases/:databaseName/collections/:collectionId', require('./commands/collections/update.js'))

router.on('GET', '/v1/databases/:databaseName/collections/:collectionId/records', require('./commands/records/search.js'))
router.on('POST', '/v1/databases/:databaseName/collections/:collectionId/records', require('./commands/records/create.js'))
router.on('GET', '/v1/databases/:databaseName/collections/:collectionId/records/:recordId', require('./commands/records/read.js'))

let server
function start () {
  server = http.createServer((req, res) => {
    router.lookup(req, res)
  }).listen(config.port)

  console.log(`Listening on port ${config.port}`)
}

function stop () {
  server.close()
}

module.exports = { start, stop }
