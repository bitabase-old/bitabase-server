const righto = require('righto');
const callarestJson = require('callarest/json');

const reset = require('./helpers/reset');
const createServer = require('../server');
const rightoTest = require('./helpers/rightoTest');

function applyRulesToUsercollection (callback) {
  return callarestJson({
    url: 'http://localhost:8000/v1/databases/test/collections/users',
    method: 'put',
    body: {
      name: 'users',
      schema: {
        username: ['required', 'string'],
        password: ['required', 'string'],
        groups: ['array']
      },
      transducers: [
        '{...body password: hashText(body.password)}',
        `method === "post" &&
        (
          (length(body.groups) == 0 ||
           includes(user "groups" "manage_users")
          )
        ) ? body : reject(401 "not allowed to add groups")`
      ],
      presenters: [
        '{...record delete password}'
      ]
    }
  }, callback);
}

function createUserCollection (callback) {
  callarestJson({
    url: 'http://localhost:8000/v1/databases/test/collections',
    method: 'post',
    body: {
      name: 'users',
      schema: {
        username: ['required', 'string'],
        password: ['required', 'string'],
        groups: ['array']
      },
      transducers: [
        '{...body password: hashText(body.password)}'
      ],
      presenters: [
        '{...record delete password}'
      ]
    }
  }, callback);
}

function createUser (opts = {}, callback) {
  callarestJson({
    url: 'http://localhost:8000/v1/databases/test/records/users',
    method: 'post',
    body: {
      username: opts.username || 'testuser',
      password: 'testpass',
      groups: opts.groups || []
    }
  }, callback);
}

rightoTest('create user collection without permission', function * (t) {
  t.plan(8);

  yield righto(reset);
  const server = createServer();
  yield righto(server.start);

  yield righto(createUserCollection);

  const adminUser = yield righto(createUser, { groups: ['manage_users'] });
  t.equal(adminUser.response.statusCode, 201);

  // Attach rules
  yield righto(applyRulesToUsercollection);

  const secondUserEventual = righto(createUser, { username: 'testuser2', groups: ['manage_users'] });
  const secondUser = yield righto.handle(secondUserEventual, (originalError, callback) => {
    callback(null, originalError);
  });

  t.deepEqual(secondUser.body, 'not allowed to add groups');
  t.equal(secondUser.response.statusCode, 401);

  const thirdUser = yield righto(createUser, { username: 'testuser2' });
  t.equal(thirdUser.response.statusCode, 201);
  t.equal(thirdUser.body.username, 'testuser2');
  t.deepEqual(thirdUser.body.groups, []);
  t.notOk(thirdUser.body.password);
  t.ok(thirdUser.body.id);

  yield righto(server.stop);
});

rightoTest('create user collection as user with permission', function * (t) {
  t.plan(5);

  yield righto(reset);
  const server = createServer();
  yield righto(server.start);

  yield righto(createUserCollection);

  yield righto(createUser, { groups: ['manage_users'] });

  yield righto(applyRulesToUsercollection);

  const anotherUser = yield righto(callarestJson, {
    url: 'http://localhost:8000/v1/databases/test/records/users',
    headers: {
      Host: 'example.localhost:8000',
      username: 'testuser',
      password: 'testpass'
    },
    method: 'post',
    body: {
      username: 'testuser2',
      password: 'testpass',
      groups: ['manage_users']
    }
  });

  t.equal(anotherUser.response.statusCode, 201);
  t.equal(anotherUser.body.username, 'testuser2');
  t.deepEqual(anotherUser.body.groups, ['manage_users']);
  t.notOk(anotherUser.body.password);
  t.ok(anotherUser.body.id);

  yield righto(server.stop);
});

rightoTest('auth with invalid details', function * (t) {
  t.plan(2);

  yield righto(reset);
  const server = createServer();
  yield righto(server.start);

  yield righto(createUserCollection);

  yield righto(createUser, { groups: ['manage_users'] });

  // Attach rules
  yield righto(applyRulesToUsercollection);

  const anotherUserEventual = righto(callarestJson, {
    url: 'http://localhost:8000/v1/databases/test/records/users',
    headers: {
      username: 'testuser',
      password: 'wrongpass'
    },
    method: 'post',
    body: {
      username: 'testuser2',
      password: 'testpass',
      groups: ['manage_users']
    }
  });
  const anotherUser = yield righto.handle(anotherUserEventual, (originalError, callback) => {
    callback(null, originalError);
  });

  t.equal(anotherUser.response.statusCode, 401);
  t.equal(anotherUser.body, 'incorrect username and password');

  yield righto(server.stop);
});
