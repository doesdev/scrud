'use strict'

// setup
import test from 'ava'
import scrud from './index'
import axios from 'axios'
import getScrud from 'get-scrud'
const allowOrigins = ['localhost']
const postBody = {
  first: 'andrew',
  last: 'carpenter',
  zip: 37601,
  email: 'andrew@audioinhd.com'
}
const basePath = '/api'
const port = 8092
const apiCall = getScrud({host: 'localhost', port, basePath})
const putBody = {zip: 37615}
const opts = {port, base: basePath, namespace: 'scrud', allowOrigins}
Object.assign(opts, require('./../_secrets/scrud/config.json'))

// globals
let id

// tests
test.before(async () => {
  await scrud.register('member')
  await scrud.start(opts)
})

test.serial('CREATE', async (assert) => {
  // create first so that we can expect data in other actions
  id = (await apiCall('member', 'create', postBody)).id
  assert.truthy(id)
})

test.serial('SEARCH', async (assert) => {
  let s = await apiCall('member', 'search', {first: 'andrew'})
  assert.true(Array.isArray(s) && s.length > 0)
})

test.serial('READ', async (assert) => {
  assert.is((await apiCall('member', 'read', id)).zip, '37601')
})

test.serial('UPDATE', async (assert) => {
  assert.is((await apiCall('member', 'update', id, putBody)).zip, '37615')
})

test.serial('DELETE', async (assert) => {
  await assert.notThrows(apiCall('member', 'delete', id))
})

test.serial('regession: body parses gracefully', async (assert) => {
  let url = `http://localhost:${port}${basePath}/member/${id}`
  await assert.notThrows(axios({method: 'PUT', url, data: 'u'}))
})

test('register throws with no name', async (assert) => {
  await assert.throws(scrud.register(), Error, 'register throws with no name')
})

test('register returns resource object', async (assert) => {
  let resource = await scrud.register('profile')
  assert.truthy(resource, 'resource is defined')
  assert.truthy(resource.hasOwnProperty('name'), 'resource has name')
  assert.is(resource.name, 'profile')
})
