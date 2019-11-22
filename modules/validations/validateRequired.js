const validateRequired = (object, key) => {
  if (!object[key]) {
    return { [key]: 'required' };
  }
};

module.exports = validateRequired;
