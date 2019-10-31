const http = require('http')
const mainRouter = require('find-my-way')()
const subRouter = require('find-my-way')()
const config = require('./config/config')

mainRouter.on('POST',  '/api/accounts',                  require('./commands/account/create.js'))
mainRouter.on('GET',  '/api/collections',               require('./commands/account/collections/search.js'))
mainRouter.on('POST', '/api/collections',               require('./commands/account/collections/create.js'))
mainRouter.on('PUT',  '/api/collections/:collectionId', require('./commands/account/collections/update.js'))

subRouter.on('GET',  '/:collectionId',                  require('./commands/collections/search.js'))
subRouter.on('POST', '/:collectionId',                  require('./commands/collections/create.js'))
subRouter.on('GET',  '/:collectionId/:recordId',        require('./commands/collections/read.js'))

let server
function start () {
  server = http.createServer((req, res) => {
    if (req.headers.host === config.homeDomain) {
      if (!req.url.startsWith('/api/')) {
        require('./commands/home/index.js')(req, res)
      } else {
        mainRouter.lookup(req, res)
      }
    } else {
      subRouter.lookup(req, res)
    }
  }).listen(8000)

  console.log('Listening on port 8000')
}

function stop () {
  server.close()
}

module.exports = {start, stop}
