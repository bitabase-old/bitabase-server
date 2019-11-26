const righto = require('righto');

function sayHello (last, callback) {
  callback(null, 'hello');
}

function sayGoodbye (last, callback) {
  callback(null, [last, 'goodbye']);
}

var result = righto.reduce([
  sayHello,
  sayGoodbye
], function (result, next) {
  return righto(next, result);
}, '');

result(function (error, finalResult) {
  console.log({ error, finalResult });
});
