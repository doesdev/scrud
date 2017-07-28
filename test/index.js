'use strict'

// setup
import test from 'ava'
import scrud from './../index'
import axios from 'axios'
const allowOrigins = ['localhost']
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
    zip: 37601,
    email: 'andrew@audioinhd.com'
  }
  let putBody = {zip: 37615}
  let opts = {port: 8092, base: '/api', namespace: 'scrud', allowOrigins}
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
  assert.is(r.data.data.zip, '37601')
  // update
  let u = await axios({method: 'PUT', url: `${base}/${id}`, data: putBody})
  assert.is(u.headers.scrud, 'member:update')
  assert.is(u.data.data.zip, '37615')
  // delete
  let d = await axios({method: 'DELETE', url: `${base}/${id}`})
  assert.is(d.headers.scrud, 'member:delete')
  assert.falsy(d.data.error)
})

test('register returns resource object', async (assert) => {
  await assert.throws(scrud.register(), Error, 'register throws with no name')
  let resource = await scrud.register('profile')
  assert.truthy(resource, 'resource is defined')
  assert.truthy(resource.hasOwnProperty('name'), 'resource has name')
  assert.is(resource.name, 'profile')
})
