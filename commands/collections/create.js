const connect = require('../../modules/db')
const getCollection = require('./getCollection')
const getUser = require('./getUser')
const parseJsonBody = require('../../modules/parseJsonBody')
const evaluate = require('../../modules/evaluate')

const uuidv4 = require('uuid').v4

function sendError (statusCode, message, res) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json'
  })
  res.end(JSON.stringify(message, null, 2))
}

module.exports = async function (req, res, params) {
  try {
    const data = await parseJsonBody(req)
    const account = req.headers.host.split('.')[0]
  
    const collection = await getCollection(account, params.collectionId)

    const {configFile, config} = collection
  
    const db = await connect(configFile + '.db')
  
    let user = await getUser(db, req.headers['username'], req.headers['password'])
  
    // Validation
    let errors = {}
    Object.keys(config.schema).forEach(field => {
      if (config.schema[field].includes('required') && !data[field]) {
        errors[field] = errors[field] || []
        errors[field].push('required')
        return
      }
    })
  
    Object.keys(data).forEach(field => {
      if (!config.schema[field]) {
        errors[field] = errors[field] || []
        errors[field].push('unknown field')
        return
      }
  
      config.schema[field].forEach(checkFn => {
        if (checkFn === 'required') {
          return
        }
  
        if (checkFn === 'string') {
          checkFn = 'typeOf(value) == "string" ? null : "must be string"'
        }
  
        if (checkFn === 'array') {
          checkFn = 'typeOf(value) == "Array" ? null : "must be array"'
        }
  
        const invalid = evaluate(checkFn, {
          value: data[field],
          user
        })
  
        if (invalid) {
          errors[field] = errors[field] || []
          errors[field].push(invalid)
        }
      })
    })
  
    if (Object.values(errors).length > 0) {
      return sendError(400, errors, res)
    }
  
    // Rules
    if (config.rules && config.rules['POST']) {
      const ruleErrors = []
      ;(config.rules['POST'] || []).forEach(rule => {
        const result = evaluate(rule, {
          data, user
        })
  
        if (result) {
          ruleErrors.push(result)
        }
      })
  
      if (Object.values(ruleErrors).length > 0) {
        return sendError(400, ruleErrors, res)
      }
    }
  
    // Mutations
    Object.keys(data).forEach(field => {
      if (config.schema[field].includes('array')) {
        data[field] = JSON.stringify(data[field])
      }
    })
  
    ;(config.mutations || []).forEach(mutation => {
      const result = evaluate(mutation, {
        data, user
      })
    })

    // Insert record
    const sql = `
      INSERT INTO ${params.collectionId} 
      (id, ${Object.entries(data).map(o => o[0]).join(', ')}) 
      VALUES 
      (?, ${Object.keys(data).fill('?').join(', ')})
    `
    const stmt = await db.prepare(sql)
    const id = uuidv4()
    stmt.run.apply(stmt, [id, ...Object.entries(data).map(o => o[1])])
    await stmt.finalize()
  
    await db.close()  
  
    // Presenters
    ;(config.presenters || []).forEach(presenter => {
      const result = evaluate(presenter, {
        data, user
      })
    })

    res.writeHead(201)
    res.end(JSON.stringify(Object.assign(data, {id})))
  } catch (error) {
    if (!error.friendly) {
      console.log(error)
    }
    sendError(error.code || 500, error.friendly, res)
  }
}
