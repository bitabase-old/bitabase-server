const bcrypt = require('bcrypt')

function bcryptCompare (text, hash) {
  return bcrypt.compare(text, hash)
}

module.exports = async function (db, username, password) {
  // Get user if logged in
  if (username && password) {
    let user = await db.all(
      'SELECT * FROM users WHERE username = ?',
      [username]
    )
    user = user[0]

    const passwordMatched = await bcryptCompare(password, user.password)

    if (user && passwordMatched) {
      return user
    } else {
      throw { code: 401, friendly: 'incorrect username and password' }
    }
  }
}
