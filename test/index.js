import 'dotenv/config'
import test from 'mvt'
import { setup, teardown, pgConfig } from './_db.js'
import requireFresh from 'import-fresh'
import axios from 'axios'
import path from 'node:path'
import getScrud from 'get-scrud'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const scrudPath = path.resolve(__dirname, '..', 'index.js')
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
  postgres: pgConfig,
  jsonwebtoken: {
    secret: 'SomeRandomAstString',
    algorithm: 'HS256',
    issuer: 'SCRUD',
    audience: 'client',
    expiresIn: 1800
  }
}

const config = {
  http: { port: 8092 },
  notModified: { port: 8094, useNotModified: true }
}

const ports = Object.fromEntries(Object.entries(config).map(([k, v]) => {
  return [k, v.port]
}))

test.before(async () => {
  await setup()

  await Promise.all(Object.entries(config).map(async ([k, instance]) => {
    instance.scrud = requireFresh(scrudPath)
    const instanceOpts = Object.assign({}, opts, instance)
    await instance.scrud.start(instanceOpts)
    instance.jwt = await instance.scrud.genToken({ some: 'stuffs' })
    instance.apiCall = getScrud(Object.assign({}, apiOpts, instance))
  }))
})

test.after(async () => {
  config.http.scrud.shutdown()
  await teardown()
})

const getConfig = (configKey) => {
  const { scrud, port, apiCall, jwt } = config[configKey]
  const { sendData } = scrud
  if (port !== ports[configKey]) throw new Error('Ports not matching')
  return { scrud, port, apiCall, jwt, sendData }
}

for (const key of Object.keys(config)) {
  const pre = `${key}: `
  const use304 = key.indexOf('notModified') !== -1
  let id

  test(`${pre}CREATE`, async (assert) => {
    const { apiCall } = getConfig(key)
    // create first so that we can expect data in other actions
    const c = await apiCall('member', 'create', postBody)
    id = c.id
    assert.truthy(id)
  })

  test(`${pre}SEARCH`, async (assert) => {
    const { apiCall } = getConfig(key)
    const s = await apiCall('member', 'search', { first: 'andrew' })
    assert.true(Array.isArray(s) && s.length > 0)
  })

  test(`${pre}READ`, async (assert) => {
    const { apiCall } = getConfig(key)
    const r = await apiCall('member', 'read', id)
    assert.is(r.zip, '37601')
  })

  test(`${pre}UPDATE`, async (assert) => {
    const { apiCall } = getConfig(key)
    const u = await apiCall('member', 'update', id, putBody)
    assert.is(u.zip, '37615')
  })

  test(`${pre}[:resource].beforeSend works`, async (assert) => {
    const { scrud, apiCall } = getConfig(key)
    const { member } = scrud.resources
    const sendIt = 'hey dair'

    member.beforeSend = async (req, res, data) => sendIt

    const result = await apiCall('member', 'read', id)

    delete member.beforeSend

    assert.is(result, sendIt)
  })

  test(`${pre}[:resource].beforeQuery works`, async (assert) => {
    const { scrud, apiCall } = getConfig(key)
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
    const errMsg = 'Nopes, no such function'
    const { scrud, apiCall } = getConfig(key)
    const { sendData } = scrud
    const onError = (req, res, err) => sendData(res, { data: errMsg })

    scrud.register('nopgfunc', { onError })
    const { data: result } = await apiCall('nopgfunc', 'read', id)

    assert.is(result, errMsg)
  })

  test(`${pre}[:resource].onError works with custom handler`, async (assert) => {
    const errMsg = 'Nopes, no such function'
    const { scrud, apiCall } = getConfig(key)
    const { sendData } = scrud
    const read = () => { throw new Error('Eff naw') }
    const onError = (req, res, err) => sendData(res, { data: errMsg })

    scrud.register('nopgfunc', { read, onError })
    const { data: result } = await apiCall('nopgfunc', 'read', id)

    assert.is(result, errMsg)
  })

  test(`${pre}[:resource].beforeSend[:action] works`, async (assert) => {
    const { scrud, apiCall } = getConfig(key)
    const { member } = scrud.resources
    const sendIt = 'hey dair'

    member.beforeSend = { read: async (req, res, data) => sendIt }

    const result = await apiCall('member', 'read', id)

    delete member.beforeSend

    assert.is(result, sendIt)
  })

  test(`${pre}[:resource].beforeQuery[:action] works`, async (assert) => {
    const { scrud, apiCall } = getConfig(key)
    const { member } = scrud.resources
    const sendIt = 'hey dair'

    member.beforeQuery = {
      read: async (req, res) => { req.params.x = sendIt }
    }
    member.beforeSend = { read: async (req, res, data) => req.params.x }

    const result = await apiCall('member', 'read', id)

    delete member.beforeQuery
    delete member.beforeSend

    assert.is(result, sendIt)
  })

  test(`${pre}[:resource].onError[:action] works`, async (assert) => {
    const errMsg = 'Nopes, no such function'
    const { scrud, apiCall } = getConfig(key)
    const { sendData } = scrud
    const onError = { read: (req, res, err) => sendData(res, { data: errMsg }) }

    scrud.register('nopgfunc', { onError })
    const { data: result } = await apiCall('nopgfunc', 'read', id)

    assert.is(result, errMsg)
  })

  use304 && test(`${pre}not modified returns 304`, async (assert) => {
    const { port, jwt } = getConfig(key)
    const url = `http://localhost:${port}${basePath}/member/${id}`
    const headers = { Authorization: `Bearer ${jwt}` }
    const validateStatus = (code) => code === 200 || code === 304
    const reqOpts = { method: 'GET', url, headers, validateStatus }

    const fresh = await axios(reqOpts)
    const { status: initStatus, headers: { etag } } = fresh
    assert.is(initStatus, 200)

    headers['if-none-match'] = etag
    const cached = await axios(reqOpts)
    assert.is(cached.status, 304)
  })

  test(`${pre}missing resource id returns 404`, async (assert) => {
    const { port, jwt } = getConfig(key)
    const url = `http://localhost:${port}${basePath}/member/`
    const headers = { Authorization: `Bearer ${jwt}` }
    try {
      await axios({ method: 'PUT', url, data: putBody, headers })
    } catch (ex) {
      if (!ex.response) throw ex
      assert.is(ex.response.status, 404)
    }
  })

  test(`${pre}malformed URI returns error`, async (assert) => {
    const { port, jwt } = getConfig(key)
    const url = `http://localhost:${port}${basePath}/%`
    const headers = { Authorization: `Bearer ${jwt}` }
    try {
      await axios({ method: 'GET', url, headers })
    } catch (ex) {
      if (!ex.response) throw ex
      assert.is(ex.response.data.error, 'URI malformed')
    }
  })

  test(`${pre}bad JSON body returns error`, async (assert) => {
    const { port, jwt } = getConfig(key)
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
    const { scrud } = getConfig(key)
    await assert.throws(scrud.register, Error)
  })

  test(`${pre}register returns resource object`, async (assert) => {
    const { scrud } = getConfig(key)
    const resource = scrud.register('profile')
    assert.truthy(resource, 'resource is defined')
    const hasName = Object.prototype.hasOwnProperty.call(resource, 'name')
    assert.truthy(hasName, 'resource has name')
    assert.is(resource.name, 'profile')
  })

  test(`${pre}exported resource DB helpers work as expected`, async (assert) => {
    const { scrud } = getConfig(key)
    const locId = (await scrud.insert('member', { params: { zip: 37615 } })).id
    assert.is((await scrud.findAll('member', { params: { id: locId } }))[0].zip, '37615')
    await assert.notThrowsAsync(() => scrud.save('member', { id: locId, params: { zip: '37610' } }))
    assert.is((await scrud.find('member', { id: locId, params: {} })).zip, '37610')
    await assert.notThrowsAsync(() => scrud.destroy('member', { id: locId, params: {} }))
  })

  test(`${pre}exported SCRUD helpers work as expected`, async (assert) => {
    const { scrud } = getConfig(key)
    const locId = (await scrud.create('member', { params: { zip: 37615 } })).id
    assert.is((await scrud.search('member', { params: { id: locId } }))[0].zip, '37615')
    await assert.notThrowsAsync(() => scrud.update('member', { id: locId, params: { zip: 37610 } }))
    assert.is((await scrud.read('member', { id: locId, params: {} })).zip, '37610')
    await assert.notThrowsAsync(() => scrud.delete('member', { id: locId, params: {} }))
  })

  test(`${pre}basePth and path edge cases are handled properly`, async (assert) => {
    const { scrud, port, jwt, sendData } = getConfig(key)
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
    const enc = encodeURIComponent('?a=b&c[]=._*j&d=1/1/18&e=f?k')
    res = await axios(`http://localhost:${port}${basePath}/api${enc} `, { headers })
    assert.is(res.headers.scrud, 'api:search')
  })

  test(`${pre}SEARCH using POST works as expected`, async (assert) => {
    const { scrud, port, jwt, sendData } = getConfig(key)
    const hdl = (req, res) => Promise.resolve(sendData(res, req.params))
    const handlers = { search: hdl, create: hdl, read: hdl, update: hdl, delete: hdl }
    scrud.register('api', handlers)
    const headers = { Authorization: `Bearer ${jwt}` }

    const url = `http://localhost:${port}${basePath}/api?search=true`
    const body = { a: 'b' }
    const config = { headers }
    const res = await axios.post(url, body, config)

    assert.is(res.headers.scrud, 'api:search')
    assert.is(res.data.data.a, 'b')
  })

  test(`${pre}DELETE`, async (assert) => {
    const { apiCall } = getConfig(key)
    await assert.notThrowsAsync(() => apiCall('member', 'delete', id))
  })
}
