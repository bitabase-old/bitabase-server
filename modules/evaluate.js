const presh = require('markwylde-presh');
const righto = require('righto');
const ErrorWithObject = require('error-with-object');

const hashText = require('pbkdf2-wrapper/hashText');
const verifyHash = require('pbkdf2-wrapper/verifyHash');

function onlyAllowXHeaders (headers) {
  return Object.keys(headers)
    .reduce((newHeaders, headerKey) => {
      if (headerKey.toLowerCase().startsWith('x-')) {
        newHeaders[headerKey] = headers[headerKey];
      }
      return newHeaders;
    }, {});
}

function evaluate (script, scope, callback) {
  if (!callback) {
    throw new Error('no callback provided');
  }

  scope.headers = onlyAllowXHeaders(scope.headers);

  const globallyAvailableOption = {
    concat: (...args) => args.join(''),
    length: (thing) => thing.length,
    toUpperCase: (string) => string.toUpperCase(),
    toLowerCase: (string) => string.toLowerCase(),
    trim: (string) => string.trim(),
    join: (args, delimiter) => args.join(delimiter || ''),

    getType: (item) => {
      return Array.isArray(item) ? 'Array' : typeof item;
    },

    includes: function (obj, key, value) {
      return !!(obj && obj[key] && obj[key].includes && obj[key].includes(value));
    },

    hashText: (text) => righto(hashText, text),
    verifyHash: (plain, hashed) => righto(verifyHash, plain, hashed)
  };

  scope = {
    ...globallyAvailableOption,
    ...scope
  };

  let result;
  try {
    result = presh(script, scope);
  } catch (error) {
    return callback(new ErrorWithObject({
      script,
      scope,
      error: {
        code: 'SCRIPT_EVALUATE_RUNTIME',
        message: error
      }
    }));
  }

  if (result.error) {
    return callback(result.error);
  }

  result.value(function (error, value) {
    if (error) {
      return callback(error);
    }

    callback(null, value);
  });
}

module.exports = evaluate;
