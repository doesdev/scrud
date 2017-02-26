'use strict'

// setup
import test from 'ava'
import scrud from './../index'
import axios from 'axios'
let secrets
try {
  secrets = require('./../../_secrets/scrud/config.json')
} catch (ex) {
  secrets = {}
}

test('scrud actions are handled as expected', async (assert) => {
  await scrud.register('member')
  let postBody = {
    first: 'andrew',
    last: 'carpenter',
    zip: 37615,
    email: 'andrew@audioinhd.com'
  }
  let opts = {port: 8092, base: '/api', namespace: 'scrud'}
  Object.assign(opts, secrets)
  await scrud.start(opts)
  let base = `http://localhost:${opts.port}${opts.base}/member`
  let sParams = `${encodeURIComponent('?first=andrew')}`
  // create first so that we can expect data in other actions
  let c = await axios({method: 'POST', url: `${base}`, data: postBody})
  assert.is(c.headers.scrud, 'member:create')
  let id = c.data.data.id
  assert.truthy(id)
  // search
  let s = await axios({method: 'GET', url: `${base}${sParams}`})
  assert.is(s.headers.scrud, 'member:search')
  assert.true(Array.isArray(s.data.data) && s.data.data.length > 0)
  // read
  let r = await axios({method: 'GET', url: `${base}/${id}`})
  assert.is(r.headers.scrud, 'member:read')
  assert.is(r.data.data.first, 'andrew')
  // update
  let u = await axios({method: 'PUT', url: `${base}/${id}`})
  assert.is(u.headers.scrud, 'member:update')
  // delete
  let d = await axios({method: 'DELETE', url: `${base}/${id}`})
  assert.is(d.headers.scrud, 'member:delete')
})

test('register returns resource object', async (assert) => {
  await assert.throws(scrud.register(), Error, 'register throws with no name')
  let resource = await scrud.register('profile')
  assert.truthy(resource, 'resource is defined')
  assert.truthy(resource.hasOwnProperty('name'), 'resource has name')
  assert.is(resource.name, 'profile')
})

/* API
const scrudOpts = {port: 8081, secret: 'someSecureString', logpath: '/logs'}
const scrud = require('scrud')
const handleIt = require('./some-other-resource') // same as resource obj

async function main () {
  const someResource = await scrud.register('some-resource')
  const someOtherResource = await scrud.register('some-other-resource', handleIt)
  await scrud.start(scrudOpts)
}
*/

/* RESOURCE OBJECT
{
  name: 'some-resource',
  // these will only show up if overrides are in place for these actions
  search: (req, res) => Promise.resolve('done'),
  create: (req, res) => Promise.resolve('done'),
  read: (req, res) => Promise.resolve('done'),
  update: (req, res) => Promise.resolve('done'),
  delete: (req, res) => Promise.resolve('done')
}
*/

/* GLOBAL HELPERS
const logger = scrud.logger // {debug, info, warn, fatal}
let record = await scrud._find('some-resource', {id: 1})
let records = await scrud._findAll('some-resource', {name: 'jerry'})
let newRecord = await scrud._create('some-resource', {name: 'jimmy'})
let updatedRecord = await scrud._save('some-resource', {id: 1, name: 'john'})
*/
