const validateAlphaNumeric = (object, key) => {
  if (!object[key] || !object[key].match) {
    return { [key]: 'can only be alpha numeric' };
  }
  const matches = object[key].match(/[^a-z0-9]/gi, '');
  if (matches) {
    return { [key]: 'can only be alpha numeric' };
  }
};

module.exports = validateAlphaNumeric;
