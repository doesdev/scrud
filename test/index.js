'use strict'

// setup
import test from 'ava'
import patty from './../index'
import axios from 'axios'

test('server starts and accepts messages', async (assert) => {
  let opts = {port: 8092, base: '/api'}
  let reqPath = `api/user?first=andrew&last=carpenter&zip=37615&zip=37601`
  await patty.register('user')
  await assert.notThrows(patty.start(opts), 'start does not throw')
  let res = await axios.get(`http://localhost:${opts.port}/${reqPath}`)
  assert.is(res.headers.scrud, 'user:search')
})

test('scrud actions are handled as expected', async (assert) => {
  await patty.register('user')
  let opts = {port: 8093, base: '/api'}
  await patty.start(opts)
  let base = `http://localhost:${opts.port}${opts.base}/user`
  let sParams = `${encodeURIComponent('?first=andrew')}`
  let s = await axios({method: 'GET', url: `${base}${sParams}`})
  assert.is(s.headers.scrud, 'user:search')
  let c = await axios({method: 'POST', url: `${base}`})
  assert.is(c.headers.scrud, 'user:create')
  let r = await axios({method: 'GET', url: `${base}/1`})
  assert.is(r.headers.scrud, 'user:read')
  let u = await axios({method: 'PUT', url: `${base}/1`})
  assert.is(u.headers.scrud, 'user:update')
  let d = await axios({method: 'DELETE', url: `${base}/1`})
  assert.is(d.headers.scrud, 'user:delete')
})

test('register returns resource object', async (assert) => {
  await assert.throws(patty.register(), Error, 'register throws with no name')
  let resource = await patty.register('user')
  assert.truthy(resource, 'resource is defined')
  assert.truthy(resource.hasOwnProperty('name'), 'resource has name')
  // assert.truthy(resource.hasOwnProperty('search'), 'resource has search')
  // assert.truthy(resource.hasOwnProperty('create'), 'resource has create')
  // assert.truthy(resource.hasOwnProperty('read'), 'resource has read')
  // assert.truthy(resource.hasOwnProperty('update'), 'resource has update')
  // assert.truthy(resource.hasOwnProperty('delete'), 'resource has delete')
})

/* API
const pattyOpts = {port: 8081, secret: 'someSecureString', logpath: '/logs'}
const patty = require('paternity')
const handleIt = require('./some-other-resource') // same as resource obj

async function main () {
  const someResource = await patty.register('some-resource')
  const someOtherResource = await patty.register('some-other-resource', handleIt)
  await patty.start(pattyOpts)
}
*/

/* RESOURCE OBJECT
{
  name: 'some-resource',
  search: (req, res) => Promise.resolve('done'),
  create: (req, res) => Promise.resolve('done'),
  read: (req, res) => Promise.resolve('done'),
  update: (req, res) => Promise.resolve('done'),
  delete: (req, res) => Promise.resolve('done')
}
*/

/* GLOBAL HELPERS
const logger = patty.logger // {debug, info, warn, fatal}
let record = await patty._find('some-resource', {id: 1})
let records = await patty._findAll('some-resource', {name: 'jerry'})
let newRecord = await patty._create('some-resource', {name: 'jimmy'})
let updatedRecord = await patty._save('some-resource', {id: 1, name: 'john'})
*/
