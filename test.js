'use strict'

const test = require('mvt')
const requireFresh = require('import-fresh')
const axios = require('axios')
const path = require('path')
const getScrud = require('get-scrud')
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
  registerAPIs: ['member'],
  jsonwebtoken: {
    secret: `SomeRandomAstString`,
    algorithm: `HS256`,
    issuer: `SCRUD`,
    audience: `client`,
    expiresIn: 1800
  }
}
Object.assign(opts, require('./../_secrets/scrud/config.json'))

const config = {
  http: { port: 8092, turbo: false },
  turbo: { port: 8093, turbo: true }
}
const ports = { http: config.http.port, turbo: config.turbo.port }

test.before(async () => {
  config.http.scrud = requireFresh(path.resolve(__dirname, 'index.js'))
  config.turbo.scrud = requireFresh(path.resolve(__dirname, 'index.js'))

  const optsHttp = Object.assign({}, opts, config.http)
  const optsTurbo = Object.assign({}, opts, config.turbo)
  await config.http.scrud.start(optsHttp)
  await config.turbo.scrud.start(optsTurbo)

  config.http.jwt = await config.http.scrud.genToken({ some: 'stuffs' })
  config.turbo.jwt = await config.turbo.scrud.genToken({ some: 'stuffs' })

  config.http.apiCall = getScrud(Object.assign({}, apiOpts, config.http))
  config.turbo.apiCall = getScrud(Object.assign({}, apiOpts, config.turbo))
})

test.after(() => {
  config.http.scrud.shutdown()
  config.turbo.scrud.shutdown()
})

const getConfig = (turbo) => {
  const configKey = turbo ? 'turbo' : 'http'
  const { scrud, port, apiCall, jwt } = config[configKey]
  const { sendData } = scrud
  if (port !== ports[configKey]) throw new Error(`Ports not matching`)
  return { scrud, port, apiCall, jwt, sendData }
}

for (const turbo of [false, true]) {
  let id
  const pre = turbo ? `turbo: ` : ''

  test(`${pre}CREATE`, async (assert) => {
    const { apiCall } = getConfig(turbo)
    // create first so that we can expect data in other actions
    const c = await apiCall('member', 'create', postBody)
    id = c.id
    assert.truthy(id)
  })

  test(`${pre}SEARCH`, async (assert) => {
    const { apiCall } = getConfig(turbo)
    const s = await apiCall('member', 'search', { first: 'andrew' })
    assert.true(Array.isArray(s) && s.length > 0)
  })

  test(`${pre}READ`, async (assert) => {
    const { apiCall } = getConfig(turbo)
    const r = await apiCall('member', 'read', id)
    assert.is(r.zip, '37601')
  })

  test(`${pre}UPDATE`, async (assert) => {
    const { apiCall } = getConfig(turbo)
    const u = await apiCall('member', 'update', id, putBody)
    assert.is(u.zip, '37615')
  })

  test(`${pre}DELETE`, async (assert) => {
    const { apiCall } = getConfig(turbo)
    await assert.notThrowsAsync(() => apiCall('member', 'delete', id))
  })

  test(`${pre}[:resource].beforeSend works`, async (assert) => {
    const { scrud, apiCall } = getConfig(turbo)
    const { member } = scrud.resources
    const sendIt = 'hey dair'

    member.beforeSend = async (req, res, data) => sendIt

    const result = await apiCall('member', 'read', id)

    delete member.beforeSend

    assert.is(result, sendIt)
  })

  test(`${pre}[:resource].beforeQuery works`, async (assert) => {
    const { scrud, apiCall } = getConfig(turbo)
    const { member } = scrud.resources
    const sendIt = 'hey dair'

    member.beforeQuery = async (req, res) => { req.params.x = sendIt }
    member.beforeSend = async (req, res, data) => req.params.x

    const result = await apiCall('member', 'read', id)

    delete member.beforeQuery
    delete member.beforeSend

    assert.is(result, sendIt)
  })

  test(`${pre}[:resource].onError works`, async (assert) => {
    let error
    const { scrud, apiCall } = getConfig(turbo)
    const { sendData } = scrud
    const onError = (req, res, err) => {
      error = err.message
      return sendData(res, { data: error })
    }

    scrud.register('nopgfunc', { onError })
    await apiCall('nopgfunc', 'read', id)

    assert.is(error, 'function scrud_nopgfunc_read(unknown) does not exist')
  })

  test(`${pre}[:resource].beforeSend[:action] works`, async (assert) => {
    const { scrud, apiCall } = getConfig(turbo)
    const { member } = scrud.resources
    const sendIt = 'hey dair'

    member.beforeSend = { read: async (req, res, data) => sendIt }

    const result = await apiCall('member', 'read', id)

    delete member.beforeSend

    assert.is(result, sendIt)
  })

  test(`${pre}[:resource].beforeQuery[:action] works`, async (assert) => {
    const { scrud, apiCall } = getConfig(turbo)
    const { member } = scrud.resources
    const sendIt = 'hey dair'

    member.beforeQuery = { read: async (req, res) => {
      req.params.x = sendIt
    } }
    member.beforeSend = { read: async (req, res, data) => req.params.x }

    const result = await apiCall('member', 'read', id)

    delete member.beforeQuery
    delete member.beforeSend

    assert.is(result, sendIt)
  })

  test(`${pre}[:resource].onError[:action] works`, async (assert) => {
    let error
    const { scrud, apiCall } = getConfig(turbo)
    const { sendData } = scrud
    const onError = {}

    onError.read = (req, res, err) => {
      error = err.message
      return sendData(res, { date: error })
    }

    scrud.register('nopgfunc', { onError })
    await apiCall('nopgfunc', 'read', id)

    assert.is(error, 'function scrud_nopgfunc_read(unknown) does not exist')
  })

  test(`${pre}missing resource id returns 404`, async (assert) => {
    const { port, jwt } = getConfig(turbo)
    const url = `http://localhost:${port}${basePath}/member/`
    const headers = { Authorization: `Bearer ${jwt}` }
    try {
      await axios({ method: 'PUT', url, data: putBody, headers })
    } catch (ex) {
      if (!ex.response) throw ex
      assert.is(ex.response.status, 404)
    }
  })

  test(`${pre}bad JSON body returns error`, async (assert) => {
    const { port, jwt } = getConfig(turbo)
    const url = `http://localhost:${port}${basePath}/member/${id}`
    const headers = { Authorization: `Bearer ${jwt}` }
    try {
      await axios({ method: 'PUT', url, data: 'u', headers })
    } catch (ex) {
      if (!ex.response) throw ex
      assert.is(ex.response.data.error, 'Error parsing JSON request body')
    }
  })

  test(`${pre}register throws with no name`, async (assert) => {
    const { scrud } = getConfig(turbo)
    await assert.throws(scrud.register, Error)
  })

  test(`${pre}register returns resource object`, async (assert) => {
    const { scrud } = getConfig(turbo)
    const resource = scrud.register('profile')
    assert.truthy(resource, 'resource is defined')
    const hasName = Object.prototype.hasOwnProperty.call(resource, 'name')
    assert.truthy(hasName, 'resource has name')
    assert.is(resource.name, 'profile')
  })

  test(`${pre}exported resource DB helpers work as expected`, async (assert) => {
    const { scrud } = getConfig(turbo)
    const locId = (await scrud.insert('member', { params: { zip: 37615 } })).id
    assert.is((await scrud.findAll('member', { params: { id: locId } }))[0].zip, '37615')
    await assert.notThrowsAsync(() => scrud.save('member', { id: locId, params: { zip: '37610' } }))
    assert.is((await scrud.find('member', { id: locId, params: {} })).zip, '37610')
    await assert.notThrowsAsync(() => scrud.destroy('member', { id: locId, params: {} }))
  })

  test(`${pre}exported SCRUD helpers work as expected`, async (assert) => {
    const { scrud } = getConfig(turbo)
    const locId = (await scrud.create('member', { params: { zip: 37615 } })).id
    assert.is((await scrud.search('member', { params: { id: locId } }))[0].zip, '37615')
    await assert.notThrowsAsync(() => scrud.update('member', { id: locId, params: { zip: 37610 } }))
    assert.is((await scrud.read('member', { id: locId, params: {} })).zip, '37610')
    await assert.notThrowsAsync(() => scrud.delete('member', { id: locId, params: {} }))
  })

  test(`${pre}basePth and path edge cases are handled properly`, async (assert) => {
    const { scrud, port, jwt, sendData } = getConfig(turbo)
    const hdl = (req, res) => Promise.resolve(sendData(res, 'test'))
    const handlers = { search: hdl, create: hdl, read: hdl, update: hdl, delete: hdl }
    scrud.register('api', handlers)
    const headers = { Authorization: `Bearer ${jwt}` }
    let res
    res = await axios(`http://localhost:${port}${basePath}/api/1`, { headers })
    assert.is(res.headers.scrud, 'api:read')
    res = await axios(`http://localhost:${port}${basePath}/api/1?j=2`, { headers })
    assert.is(res.headers.scrud, 'api:read')
    res = await axios(`http://localhost:${port}${basePath}/api/ `, { headers })
    assert.is(res.headers.scrud, 'api:search')
    const enc = encodeURIComponent(`?a=b&c[]=._*j&d=1/1/18&e=f?k`)
    res = await axios(`http://localhost:${port}${basePath}/api${enc} `, { headers })
    assert.is(res.headers.scrud, 'api:search')
  })
}
