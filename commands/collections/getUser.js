const bcrypt = require('bcrypt')

function bcryptCompare (text, hash) {
  return bcrypt.compare(text, hash)
}

module.exports = function (db, username, password) {
  return new Promise(async (resolve, reject) => {
    // Get user if logged in
    if (username && password) {
      user = await db.all(
        `SELECT * FROM users WHERE username = ?`,
        [username]
      )
      user = user[0]

      const passwordMatched = await bcryptCompare(password, user.password)

      if (user && passwordMatched) {
        resolve(user)
      } else {
        reject({code: 401, friendly: 'incorrect username and password'})
      }
    } else {
      resolve()
    }
  })
}
