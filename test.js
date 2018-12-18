'use strict'

import test from 'ava'
import requireFresh from 'import-fresh'
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
const apiOpts = { host: 'localhost', basePath, timeout: '10s' }
const putBody = { zip: 37615 }
const logger = () => {}
const opts = {
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

for (let turbo of [false]) {
  const scrud = requireFresh('./index')
  const { sendData } = scrud
  let id, apiCall, jwt
  const port = opts.port = apiOpts.port = turbo ? 8093 : 8092
  const pre = turbo ? `turbo: ` : ''

  test.before(async () => {
    await scrud.register('member')
    await scrud.start(Object.assign({}, opts, { turbo }))
    jwt = await scrud.genToken({ some: 'stuffs' })
    apiCall = getScrud(Object.assign({ jwt }, apiOpts))
  })

  test.serial(`${pre}CREATE`, async (assert) => {
    // create first so that we can expect data in other actions
    let c = await apiCall('member', 'create', postBody)
    id = c.id
    assert.truthy(id)
  })

  test.serial(`${pre}SEARCH`, async (assert) => {
    let s = await apiCall('member', 'search', { first: 'andrew' })
    assert.true(Array.isArray(s) && s.length > 0)
  })

  test.serial(`${pre}READ`, async (assert) => {
    let r = await apiCall('member', 'read', id)
    assert.is(r.zip, '37601')
  })

  test.serial(`${pre}UPDATE`, async (assert) => {
    let u = await apiCall('member', 'update', id, putBody)
    assert.is(u.zip, '37615')
  })

  test.serial(`${pre}DELETE`, async (assert) => {
    await assert.notThrowsAsync(apiCall('member', 'delete', id))
  })

  test.serial(`${pre}missing resource id returns 404`, async (assert) => {
    let url = `http://localhost:${port}${basePath}/member/`
    let headers = { Authorization: `Bearer ${jwt}` }
    try {
      await axios({ method: 'PUT', url, data: putBody, headers })
    } catch (ex) {
      if (!ex.response) throw ex
      assert.is(ex.response.status, 404, ex)
    }
  })

  test.serial(`${pre}bad JSON body returns error`, async (assert) => {
    let url = `http://localhost:${port}${basePath}/member/${id}`
    let headers = { Authorization: `Bearer ${jwt}` }
    try {
      await axios({ method: 'PUT', url, data: 'u', headers })
    } catch (ex) {
      if (!ex.response) throw ex
      assert.is(ex.response.status, 500, ex)
    }
  })

  test.serial(`${pre}register throws with no name`, async (assert) => {
    await assert.throwsAsync(scrud.register(), Error, 'register throws with no name')
  })

  test.serial(`${pre}register returns resource object`, async (assert) => {
    let resource = await scrud.register('profile')
    assert.truthy(resource, 'resource is defined')
    assert.truthy(resource.hasOwnProperty('name'), 'resource has name')
    assert.is(resource.name, 'profile')
  })

  test.serial(`${pre}exported resource DB helpers work as expected`, async (assert) => {
    let locId = (await scrud.insert('member', { params: { zip: 37615 } })).id
    assert.is((await scrud.findAll('member', { params: { id: locId } }))[0].zip, '37615')
    await assert.notThrowsAsync(scrud.save('member', { id: locId, params: { zip: '37610' } }))
    assert.is((await scrud.find('member', { id: locId, params: {} })).zip, '37610')
    await assert.notThrowsAsync(scrud.destroy('member', { id: locId, params: {} }))
  })

  test.serial(`${pre}exported SCRUD helpers work as expected`, async (assert) => {
    let locId = (await scrud.create('member', { params: { zip: 37615 } })).id
    assert.is((await scrud.search('member', { params: { id: locId } }))[0].zip, '37615')
    await assert.notThrowsAsync(scrud.update('member', { id: locId, params: { zip: 37610 } }))
    assert.is((await scrud.read('member', { id: locId, params: {} })).zip, '37610')
    await assert.notThrowsAsync(scrud.delete('member', { id: locId, params: {} }))
  })

  test.serial(`${pre}basePth and path edge cases are handled properly`, async (assert) => {
    let hdl = (req, res) => Promise.resolve(sendData(res, 'test'))
    let handlers = { search: hdl, create: hdl, read: hdl, update: hdl, delete: hdl }
    await scrud.register('api', handlers)
    let headers = { Authorization: `Bearer ${jwt}` }
    let res
    res = await axios(`http://localhost:${port}${basePath}/api/1`, { headers })
    assert.is(res.headers.scrud, 'api:read')
    res = await axios(`http://localhost:${port}${basePath}/api/1?j=2`, { headers })
    assert.is(res.headers.scrud, 'api:read')
    res = await axios(`http://localhost:${port}${basePath}/api/ `, { headers })
    assert.is(res.headers.scrud, 'api:search')
    let enc = encodeURIComponent(`?a=b&c[]=._*j&d=1/1/18&e=f?k`)
    res = await axios(`http://localhost:${port}${basePath}/api${enc} `, { headers })
    assert.is(res.headers.scrud, 'api:search')
  })
}
