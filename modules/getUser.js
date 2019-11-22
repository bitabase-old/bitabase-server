const verifyHash = require('pbkdf2-wrapper/verifyHash');
const sqlite = require('sqlite-fp');

const ErrorWithObject = require('error-with-object');

const returnUserResult = (password, callback) => (error, user) => {
  if (error) { return callback(error); }

  user = user[0];

  verifyHash(password, user.password, function (error, passwordMatched) {
    if (error) {
      return callback(error);
    }

    if (user && passwordMatched) {
      callback(null, user);
    } else {
      callback(new ErrorWithObject({ statusCode: 401, friendly: 'incorrect username and password' }));
    }
  });
};

module.exports = config => function (db, username, password, callback) {
  // Get user if logged in
  if (username && password) {
    sqlite.getAll('SELECT * FROM users WHERE username = ?', [username], db, returnUserResult(password, callback));
  } else {
    callback(null, null);
  }
};
