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
const apiOpts = {host: 'localhost', port, basePath, timeout: '10s'}
const putBody = {zip: 37615}
const logger = () => {}
const opts = {
  port,
  base: basePath,
  namespace: 'scrud',
  allowOrigins,
  logger,
  setScrudHeader: true,
  jsonwebtoken: {
    secret: `SomeRandomAstString`,
    algorithm: `HS256`,
    issuer: `SCRUD`,
    audience: `client`,
    expiresIn: 1800
  }
}
Object.assign(opts, require('./../_secrets/scrud/config.json'))
const { sendData } = scrud

// globals
let id, apiCall, jwt

// tests
test.before(async () => {
  await scrud.register('member')
  await scrud.start(opts)
  jwt = await scrud.genToken({some: 'stuffs'})
  apiCall = getScrud(Object.assign({jwt}, apiOpts))
})

test.serial('CREATE', async (assert) => {
  // create first so that we can expect data in other actions
  let c = await apiCall('member', 'create', postBody)
  id = c.id
  assert.truthy(id)
})

test.serial('SEARCH', async (assert) => {
  let s = await apiCall('member', 'search', {first: 'andrew'})
  assert.true(Array.isArray(s) && s.length > 0)
})

test.serial('READ', async (assert) => {
  let r = await apiCall('member', 'read', id)
  assert.is(r.zip, '37601')
})

test.serial('UPDATE', async (assert) => {
  let u = await apiCall('member', 'update', id, putBody)
  assert.is(u.zip, '37615')
})

test.serial('DELETE', async (assert) => {
  await assert.notThrows(apiCall('member', 'delete', id))
})

test.serial('regession: body parses gracefully', async (assert) => {
  let url = `http://localhost:${port}${basePath}/member/${id}`
  let headers = {Authorization: `Bearer ${jwt}`}
  await assert.notThrows(axios({method: 'PUT', url, data: 'u', headers}))
})

test.skip('close ends pg client (not really testable)', async (assert) => {
  let url = `http://localhost:${port}${basePath}/member?first=andrew`
  await assert.throws(axios({method: 'GET', url, timeout: 3}))
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

test(`exported resource DB helpers work as expected`, async (assert) => {
  let locId = (await scrud.insert('member', {params: {zip: 37615}})).id
  assert.is((await scrud.findAll('member', {params: {id: locId}}))[0].zip, '37615')
  await assert.notThrows(scrud.save('member', {id: locId, params: {zip: '37610'}}))
  assert.is((await scrud.find('member', {id: locId, params: {}})).zip, '37610')
  await assert.notThrows(scrud.destroy('member', {id: locId, params: {}}))
})

test(`exported SCRUD helpers work as expected`, async (assert) => {
  let locId = (await scrud.create('member', {params: {zip: 37615}})).id
  assert.is((await scrud.search('member', {params: {id: locId}}))[0].zip, '37615')
  await assert.notThrows(scrud.update('member', {id: locId, params: {zip: 37610}}))
  assert.is((await scrud.read('member', {id: locId, params: {}})).zip, '37610')
  await assert.notThrows(scrud.delete('member', {id: locId, params: {}}))
})

test(`basePth and path edge cases are handled properly`, async (assert) => {
  let hdl = (req, res) => Promise.resolve(sendData(res, 'test'))
  let handlers = {search: hdl, create: hdl, read: hdl, update: hdl, delete: hdl}
  await scrud.register('api', handlers)
  let headers = {Authorization: `Bearer ${jwt}`}
  let res
  res = await axios(`http://localhost:${port}${basePath}/api/1`, {headers})
  assert.is(res.headers.scrud, 'api:read')
  res = await axios(`http://localhost:${port}${basePath}/api/1?j=2`, {headers})
  assert.is(res.headers.scrud, 'api:read')
  res = await axios(`http://localhost:${port}${basePath}/api/ `, {headers})
  assert.is(res.headers.scrud, 'api:search')
  let enc = encodeURIComponent('?a=b&c[]=d._*j')
  res = await axios(`http://localhost:${port}${basePath}/api${enc} `, {headers})
  assert.is(res.headers.scrud, 'api:search')
})
