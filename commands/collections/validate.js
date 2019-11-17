const validateAlphaNumeric = require('../../modules/validations/validateAlphaNumeric')
const validateKeyIsAlphaNumeric = require('../../modules/validations/validateKeyIsAlphaNumeric')
const validateObjectProperties = require('../../modules/validations/validateObjectProperties')
const validateArrayOfStrings = require('../../modules/validations/validateArrayOfStrings')
const validateKeyInList = require('../../modules/validations/validateKeyInList')

function validate (data, callback) {
  const validations = [
    validateAlphaNumeric(data, 'name'),

    validateObjectProperties(data, 'schema', [
      validateKeyIsAlphaNumeric,
      validateArrayOfStrings
    ]),

    validateArrayOfStrings(data, 'presenters'),

    validateArrayOfStrings(data, 'mutations'),

    validateObjectProperties(data, 'rules', [
      validateKeyInList.bind(null, ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
      validateArrayOfStrings
    ])
  ].filter(item => !!item)

  if (validations.length > 0) {
    const result = Object.assign.apply(null, validations)
    callback && callback(result)
    return result
  } else {
    callback && callback(null, data)
  }
}

module.exports = validate
