const ErrorWithObject = require('error-with-object');

const validateAlphaNumericDash = require('../../modules/validations/validateAlphaNumericDash');
const validateKeyIsAlphaNumericDash = require('../../modules/validations/validateKeyIsAlphaNumericDash');
const validateObjectProperties = require('../../modules/validations/validateObjectProperties');
const validateArrayOfStrings = require('../../modules/validations/validateArrayOfStrings');
const validateKeyInList = require('../../modules/validations/validateKeyInList');
const validateRequired = require('../../modules/validations/validateRequired');

function validate (data, callback) {
  const validations = [
    validateRequired(data, 'name'),
    validateRequired(data, 'schema'),

    validateAlphaNumericDash(data, 'name'),

    validateObjectProperties(data, 'schema', [
      validateKeyIsAlphaNumericDash,
      validateArrayOfStrings
    ]),

    validateArrayOfStrings(data, 'presenters'),

    validateArrayOfStrings(data, 'transforms'),

    validateObjectProperties(data, 'rules', [
      validateKeyInList.bind(null, ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
      validateArrayOfStrings
    ])
  ].filter(item => !!item);

  if (validations.length > 0) {
    const result = Object.assign.apply(null, validations);
    callback && callback(new ErrorWithObject({
      statusCode: 400,
      message: result
    }));
    return result;
  } else {
    callback && callback(null, data);
  }
}

module.exports = validate;
