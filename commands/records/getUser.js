const verifyHash = require('pbkdf2-wrapper/verifyHash');

const ErrorWithObject = require('error-with-object');

module.exports = config => function (db, username, password, callback) {
  // Get user if logged in
  if (username && password) {
    db.all(
      'SELECT * FROM users WHERE username = ?',
      [username]
    ).then(user => {
      user = user[0];

      verifyHash(password, user.password, function (error, passwordMatched) {
        if (error) {
          return callback(error);
        }

        if (user && passwordMatched) {
          callback(null, user);
        } else {
          callback(new ErrorWithObject({ code: 401, friendly: 'incorrect username and password' }));
        }
      });
    });
  } else {
    callback(null, null);
  }
};
