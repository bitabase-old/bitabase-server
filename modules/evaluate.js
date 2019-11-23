const presh = require('presh');
const righto = require('righto');

const hashText = require('pbkdf2-wrapper/hashText');
const verifyHash = require('pbkdf2-wrapper/verifyHash');

function evaluate (script, scope, callback) {
  if (!callback) {
    throw new Error('no callback provided');
  }

  scope = {
    concat: (...args) => args.join(''),
    length: (thing) => thing.length,
    getType: (item) => {
      return Array.isArray(item) ? 'Array' : typeof item;
    },
    includes: function (obj, key, value) {
      return !!(obj && obj[key] && obj[key].includes && obj[key].includes(value));
    },
    hashText: (text) => righto(hashText, text),
    verifyHash: (plain, hashed) => righto(verifyHash, plain, hashed),
    ...scope
  };

  let result;
  try {
    result = presh(script, scope);
  } catch (error) {
    return callback(error);
  }

  if (result.error) {
    return callback(result.error);
  }

  result.value(function (error, value) {
    if (error) {
      return callback(result.error);
    }

    callback(null, value);
  });
}

module.exports = evaluate;
