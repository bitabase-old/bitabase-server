const righto = require('righto');
const test = require('tape');

const outputOnError = error => { error && console.log(error); };

function rightoTest (name, fn) {
  test(name, function (t) {
    const generator = righto.iterate(fn);
    const result = righto(generator, t);
    result(outputOnError);
  });
}

rightoTest.only = function (name, fn) {
  test.only(name, function (t) {
    const generator = righto.iterate(fn);
    const result = righto(generator, t);
    result(outputOnError);
  });
};

module.exports = rightoTest;
