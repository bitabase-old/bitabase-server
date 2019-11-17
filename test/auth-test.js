const test = require('tape')
const httpRequest = require('./helpers/httpRequest')
const reset = require('./helpers/reset')
const createServer = require('../server')

function applyRulesToUsercollection () {
  return httpRequest('/v1/databases/test/collections/users', {
    method: 'put',
    data: {
      name: 'users',
      schema: {
        username: ['required', 'string'],
        password: ['required', 'string'],
        groups: ['array']
      },
      mutations: [
        'data.password = data.password ? bcrypt(data.password) : undefined'
      ],
      presenters: [
        'data.password = undefined'
      ],
      rules: {
        POST: [
          'length(data.groups) == 0 or includes(user, "groups", "manage_users") ? "" : "not allowed to add groups"'
        ],
        PUT: [
          'includes(user, "groups", "manage_users")'
        ],
        PATCH: [
          'includes(user, "groups", "manage_users")'
        ],
        DELETE: [
          'error("can not delete people")'
        ]
      }
    }
  })
}

function createUserCollection () {
  return httpRequest('/v1/databases/test/collections', {
    method: 'post',
    data: {
      name: 'users',
      schema: {
        username: ['required', 'string'],
        password: ['required', 'string'],
        groups: ['array']
      },
      mutations: [
        'data.password = data.password ? bcrypt(data.password) : undefined'
      ],
      presenters: [
        'data.password = undefined'
      ]
    }
  })
}

function createUser (opts = {}) {
  return httpRequest('/v1/databases/test/collections/users/records', {
    method: 'post',
    data: {
      username: opts.username || 'testuser',
      password: 'testpass',
      groups: opts.groups || []
    }
  })
}

test('create user collection without permission', async t => {
  t.plan(9)
  await reset()

  const server = await createServer().start()
  await createUserCollection()

  const adminUser = await createUser({ groups: ['manage_users'] })
  t.equal(adminUser.status, 201)

  // Attach rules
  await applyRulesToUsercollection()

  const secondUser = await createUser({ username: 'testuser2', groups: ['manage_users'] })
  t.equal(secondUser.status, 400)
  t.deepEqual(secondUser.data, ['not allowed to add groups'])

  const thirdUser = await createUser({ username: 'testuser2' })
  t.equal(thirdUser.status, 201)

  t.equal(thirdUser.status, 201)
  t.equal(thirdUser.data.username, 'testuser2')
  t.equal(thirdUser.data.groups, '[]')
  t.notOk(thirdUser.data.password)
  t.ok(thirdUser.data.id)

  await server.stop()
})

test('create user collection as user with permission', async t => {
  t.plan(5)
  await reset()

  const server = await createServer().start()

  await createUserCollection()

  await createUser({ groups: ['manage_users'] })

  // Attach rules
  await applyRulesToUsercollection()

  const anotherUser = await httpRequest('/v1/databases/test/collections/users/records', {
    headers: {
      Host: 'example.localhost:8000',
      username: 'testuser',
      password: 'testpass'
    },
    method: 'post',
    data: {
      username: 'testuser2',
      password: 'testpass',
      groups: ['manage_users']
    }
  })

  t.equal(anotherUser.status, 201)
  t.equal(anotherUser.data.username, 'testuser2')
  t.equal(anotherUser.data.groups, '["manage_users"]')
  t.notOk(anotherUser.data.password)
  t.ok(anotherUser.data.id)

  await server.stop()
})

test('auth with invalid details', async t => {
  t.plan(2)
  await reset()

  const server = await createServer().start()

  await createUserCollection()

  await createUser({ groups: ['manage_users'] })

  // Attach rules
  await applyRulesToUsercollection()

  const anotherUser = await httpRequest('/v1/databases/test/collections/users/records', {
    headers: {
      username: 'testuser',
      password: 'wrongpass'
    },
    method: 'post',
    data: {
      username: 'testuser2',
      password: 'testpass',
      groups: ['manage_users']
    }
  })

  t.equal(anotherUser.status, 401)
  t.equal(anotherUser.data, 'incorrect username and password')

  await server.stop()
})
