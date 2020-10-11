const righto = require('righto');
const ErrorWithObject = require('error-with-object');

const evaluate = require('./evaluate');

function checkFieldValidation (appConfig, schema, field, scope, callback) {
  if (!schema[field]) {
    return callback(null, { [field]: 'unknown column' });
  }

  const fieldValidations = schema[field].map(checkFn => {
    if (checkFn === 'required') {
      return;
    }

    if (checkFn === 'string') {
      checkFn = 'value == null || getType(value) == "string" ? null : "must be string"';
    }

    if (checkFn === 'number') {
      checkFn = 'value == null || getType(value) == "number" ? null : "must be number"';
    }

    if (checkFn === 'array') {
      checkFn = 'value == null || getType(value) == "Array" ? null : "must be array"';
    }

    return righto(evaluate, appConfig, checkFn, {
      ...scope,
      field,
      value: scope.body[field]
    });
  });

  righto.all(fieldValidations)(function (error, fieldResult) {
    if (error) { return callback(error); }

    const errors = fieldResult.reduce((accumulator, invalid) => {
      if (invalid) {
        accumulator[field] = accumulator[field] || [];
        accumulator[field].push(invalid);
      }
      return accumulator;
    }, {});

    callback(null, errors);
  });
}

function checkSchemaValidations (appConfig, schema, scope, errors, callback) {
  if (!schema) {
    return callback();
  }

  const schemaValidations = Object.keys(scope.body)
    .map(field => {
      return righto(checkFieldValidation, appConfig, schema, field, scope);
    });

  righto.all(schemaValidations)(function (error, results) {
    if (error) { return callback(error); }

    results.forEach(validationError => {
      errors = Object.assign(errors, validationError);
    });

    if (Object.keys(errors).length > 0) {
      return callback(new ErrorWithObject({
        statusCode: 422,
        friendly: errors
      }));
    }
    callback();
  });
}

function checkForRequiredFields (schema, body) {
  const errors = {};
  Object.keys(schema).forEach(field => {
    if (schema[field].includes('required') && !body[field]) {
      errors[field] = errors[field] || [];
      errors[field].push('required');
    }
  });
  return errors;
}

function checkForUnknownFields (schema, body) {
  const errors = {};
  Object.keys(body).map(field => {
    if (!schema[field]) {
      errors[field] = errors[field] || [];
      errors[field].push('unknown field');
    }
  });
  return errors;
}

function validateDataAgainstSchema (appConfig, collectionConfig, scope, callback) {
  if (!collectionConfig) {
    throw new Error('validateDataAgainstSchema must be called with a collectionConfig');
  }

  const { schema } = collectionConfig;

  if (!schema) {
    return callback(null, scope.body);
  }

  const errors = {
    ...checkForUnknownFields(schema, scope.body),
    ...checkForRequiredFields(schema, scope.body)
  };

  const schemaValidated = righto(checkSchemaValidations, appConfig, schema, scope, errors);
  const result = righto.mate(scope.body, righto.after(schemaValidated));

  result(callback);
}

module.exports = validateDataAgainstSchema;
