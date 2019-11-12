const righto = require('righo')
righto._debug = true;
righto._autotraceOnError = true;

const test = require('tape')
const httpRequest = require('./helpers/httpRequest')
const reset = require('./helpers/reset')
const server = require('../server')

async function createTestCollection () {
  await httpRequest('/v1/databases/test/collections', {
    method: 'post',
    data: {
      id: 'test',
      schema: {
        test: ['required', 'string']
      }
    }
  })
}

test('list items in collection when empty', async t => {
  t.plan(1)
  await reset()

  await server.start()

  await createTestCollection()

  const response = await httpRequest('/v1/databases/test/collections/test/records', {
    method: 'get'
  })

  t.deepEqual(response.data, {
    count: 0,
    items: []
  })

  await server.stop()
})

test('create item in collection with built in validation error', async t => {
  t.plan(2)
  await reset()

  await server.start()

  // Create test collection with validation
  await httpRequest('/v1/databases/test/collections', {
    method: 'post',
    data: {
      id: 'test',
      schema: {
        testString: ['string'],
        testRequired: ['required'],
        testRequiredAgain: ['required']
      }
    }
  })

  // Make request
  const response = await httpRequest('/v1/databases/test/collections/test/records', {
    method: 'post',
    data: {
      testString: 10,
      testRequired: ''
    }
  })

  t.equal(response.status, 400)
  t.deepEqual(response.data, {
    testString: ['must be string'],
    testRequired: ['required'],
    testRequiredAgain: ['required']
  })

  await server.stop()
})

test('create item in collection without using all fields', async t => {
  t.plan(3)
  await reset()

  await server.start()

  // Create test collection with validation
  await httpRequest('/v1/databases/test/collections', {
    method: 'post',
    data: {
      id: 'test',
      schema: {
        testOptionalOne: ['string'],
        testOptionalTwo: ['string']
      }
    }
  })

  // Make request
  const response = await httpRequest('/v1/databases/test/collections/test/records', {
    method: 'post',
    data: {
      testOptionalOne: 'test'
    }
  })

  t.equal(response.status, 201)
  t.ok(response.data.id)
  t.equal(response.data.testOptionalOne, 'test')

  await server.stop()
})

test('create item in collection with custom validation error', async t => {
  t.plan(2)
  await reset()

  await server.start()

  // Create test collection with validation
  await httpRequest('/v1/databases/test/collections', {
    method: 'post',
    data: {
      id: 'test',
      schema: {
        test: ['required', 'string', 'value == "something" ? null : "must be something"']
      }
    }
  })

  // Make request
  const response = await httpRequest('/v1/databases/test/collections/test/records', {
    method: 'post',
    data: {
      test: 'test1'
    }
  })

  t.equal(response.status, 400)
  t.deepEqual(response.data, {
    test: ['must be something']
  })

  await server.stop()
})

test('create item in collection with customer presenter', async t => {
  t.plan(5)
  await reset()

  await server.start()

  // Create test collection with validation
  await httpRequest('/v1/databases/test/collections', {
    method: 'post',
    data: {
      id: 'test',
      schema: {
        test: ['required', 'string'],
        testToRemove: ['required', 'string']
      },
      presenters: [
        'data.testToRemove = undefined'
      ]
    }
  })

  // Make request
  const response = await httpRequest('/v1/databases/test/collections/test/records', {
    method: 'post',
    data: {
      test: 'test1',
      testToRemove: 'be_gone'
    }
  })

  t.equal(response.status, 201)
  t.equal(response.data.test, 'test1')
  t.notOk(response.data.testToRemove)
  t.ok(response.data.id)

  // Find record
  const found = await httpRequest(
    `/v1/databases/test/collections/test/records/${response.data.id}`
  )

  t.notOk(found.data.testToRemove)

  await server.stop()
})

test('create item in collection with customer mutation', async t => {
  t.plan(4)
  await reset()

  await server.start()

  // Create test collection with validation
  await httpRequest('/v1/databases/test/collections', {
    method: 'post',
    data: {
      id: 'test',
      schema: {
        test: ['required', 'string']
      },
      mutations: [
        'data.test = concat(data.test, "-changed")'
      ]
    }
  })

  // Make request
  const response = await httpRequest('/v1/databases/test/collections/test/records', {
    method: 'post',
    data: {
      test: 'test1'
    }
  })

  t.equal(response.status, 201)
  t.equal(response.data.test, 'test1-changed')
  t.ok(response.data.id)

  // Find record
  const found = await httpRequest(
    `/v1/databases/test/collections/test/records/${response.data.id}`
  )

  t.equal(found.data.test, 'test1-changed')

  await server.stop()
})
