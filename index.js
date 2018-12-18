'use strict'

// setup
const tinyParams = require('tiny-params')
const zlib = require('zlib')
const Lru = require('quick-lru')
const port = process.env.PORT || process.env.port || 8091
const defaultTimeout = 120000
const checkId = { read: true, update: true, delete: true }
const useFirstRecord = { create: true, read: true, update: true }
const firstRecord = (d) => Promise.resolve(d[0])
const noop = () => {}
const dummyRes = {
  addTrailers: noop,
  end: noop,
  getHeader: noop,
  getHeaderNames: noop,
  getHeaders: noop,
  hasHeader: noop,
  removeHeader: noop,
  setHeader: noop,
  setTimeout: noop,
  write: noop,
  writeContinue: noop,
  writeHead: noop
}
const scrud = {
  GET: 'search',
  'GET?': 'search',
  POST: 'create',
  'POST/': 'create',
  'GET/': 'read',
  'PUT/': 'update',
  'DELETE/': 'delete'
}
const hasBody = { create: true, update: true }
const wlSign = [
  'algorithm',
  'expiresIn',
  'notBefore',
  'audience',
  'issuer',
  'jwtid',
  'subject',
  'noTimestamp',
  'header'
]

// LRU cache
const urlCache = new Lru({ maxSize: 20 })

// globals
let jsonwebtoken
let logger
let pgPool
let jwtOpts
let authTrans
let pgPrefix = ''
let base = '/'
let baseChars = base.length
let maxBodyBytes = 1e6
let resources = {}
let allowOrigins = {}
let gzipThreshold = 1000
let getIp
let setScrudHeader
let turbo

// local helpers
const logIt = (e, level = 'fatal') => {
  typeof logger === 'function' ? logger(e, level) : console.log(e)
}

const parseUrl = (req) => {
  const sig = `${req.method}${req.url}`
  if (urlCache.has(sig)) return urlCache.get(sig)
  const url = decodeURIComponent(req.url).slice(baseChars)
  const sIdx = url.indexOf('/')
  const qIdx = url.indexOf('?')
  const modIdx = (sIdx === -1 || (qIdx !== -1 && sIdx > qIdx)) ? qIdx : sIdx
  const lastIdx = url.length - 1

  let id
  if (sIdx === modIdx) {
    const postMod = url.slice(sIdx + 1)
    if (postMod) {
      let nextMod = postMod.indexOf('/')
      if (nextMod === -1) nextMod = postMod.indexOf('?')
      id = nextMod === -1 ? postMod : postMod.slice(0, nextMod)
    }
  }

  const noMod = modIdx === -1
  const name = noMod ? url : url.slice(0, modIdx)
  const modifier = noMod || modIdx === lastIdx ? '' : url.charAt(modIdx)
  const action = scrud[`${req.method}${modifier}`]
  const params = tinyParams(url)
  const data = { url, name, action, id, params }

  urlCache.set(sig, data)
  return data
}

const callPgFunc = (name, params, req) => {
  const q = `SELECT * FROM ${name}($1);`
  if (!pgPool) return Promise.reject(new Error('No database configured'))

  return pgPool.connect().then((client) => {
    let released
    const release = (fauxErr) => {
      if (!client || !client.release || released) return
      released = true
      client.release(fauxErr)
    }

    const close = () => release(true)
    if (req && req.once) req.once('close', close)

    return client.query(q, [params]).then((data) => {
      if (req && req.removeListener) req.removeListener('close', close)
      release()
      return Promise.resolve((data.rows[0] || {})[name] || [])
    }).catch((err) => {
      if (req && req.removeListener) req.removeListener('close', close)
      release()
      return Promise.reject(err)
    })
  }).catch((err) => {
    try {
      err.meta = err.meta || {}
      err.meta.pgFunction = name
      let errObj = JSON.parse(err.message)
      err.message = errObj.error ? errObj.error : errObj
    } catch (ex) {}
    return Promise.reject(err)
  })
}

const bodyParse = (req) => new Promise((resolve, reject) => {
  let body = ''
  const ondata = (d, start, end) => {
    if (start !== undefined && end !== undefined) {
      body += d.slice(start, start + end).toString('utf8')
    } else {
      body += d.toString('utf8')
    }
    if (body.length > maxBodyBytes) return reject(new Error('Body too large'))
  }
  const parse = () => {
    try {
      resolve(body ? JSON.parse(body) : {})
    } catch (ex) {
      logIt(ex, 'warn')
      reject(new Error('Error parsing JSON request body'))
    }
  }

  if (turbo) {
    req.ondata = ondata
    req.onend = parse
  } else {
    req.on('data', ondata)
    req.on('end', parse)
  }
})

const getBodyParser = (req) => {
  if (!turbo) return () => bodyParse(req)
  const prom = bodyParse(req)
  return () => prom
}

const filterObj = (obj, ary) => {
  const base = {}
  ary.forEach((o) => { if (o in obj) base[o] = obj[o] })
  return base
}

// database action handlers
const handlers = {}
const find = handlers.read = (rsrc, req) => pgActions(rsrc, 'read', req)
const findAll = handlers.search = (rsrc, req) => pgActions(rsrc, 'search', req)
const create = handlers.create = (rsrc, req) => pgActions(rsrc, 'create', req)
const save = handlers.update = (rsrc, req) => pgActions(rsrc, 'update', req)
const destroy = handlers.delete = (rsrc, req) => pgActions(rsrc, 'delete', req)

// exports
module.exports = {
  register,
  start,
  sendData,
  sendErr,
  logIt,
  fourOhOne,
  fourOhFour,
  genToken,
  authenticate,
  find,
  findAll,
  insert: create,
  save,
  destroy,
  callPgFunc,
  read: (rsrc, req) => actionHandler(req, null, rsrc, 'read', true),
  create: (rsrc, req) => actionHandler(req, null, rsrc, 'create', true),
  search: (rsrc, req) => actionHandler(req, null, rsrc, 'search', true),
  update: (rsrc, req) => actionHandler(req, null, rsrc, 'update', true),
  delete: (rsrc, req) => actionHandler(req, null, rsrc, 'delete', true)
}

// register resource
function register (name, opts = {}) {
  if (!name) return Promise.reject(new Error(`No name specified in register`))
  return new Promise((resolve, reject) => {
    const r = resources[name] = Object.assign({}, opts, { name })
    if (Array.isArray(r.skipAuth)) {
      const skippers = {}
      r.skipAuth.forEach((a) => { skippers[a] = true })
      r.skipAuth = skippers
    }
    return resolve(r)
  })
}

// start server
function start (opts = {}) {
  if (opts.namespace) pgPrefix = `${opts.namespace.toLowerCase()}_`
  if (opts.maxBodyBytes) maxBodyBytes = opts.maxBodyBytes
  if (opts.jsonwebtoken) {
    jsonwebtoken = require('jsonwebtoken')
    jwtOpts = opts.jsonwebtoken
  }
  if (opts.logger) logger = opts.logger
  if (opts.base) {
    base = `/${opts.base}/`.replace(/\/+/g, '/')
    baseChars = base.length
  }
  if (opts.getIp) getIp = true
  if (opts.setScrudHeader) setScrudHeader = true
  if (opts.authTrans) authTrans = opts.authTrans
  if (opts.gzipThreshold) gzipThreshold = opts.gzipThreshold
  if (Array.isArray(opts.allowOrigins)) {
    opts.allowOrigins.forEach((k) => { allowOrigins[k] = true })
  }

  let http = require('http')
  if (opts.turbo !== false) {
    try {
      http = require('turbo-http')
      turbo = true
    } catch (ex) {
      http = require('http')
      turbo = false
    }
  }

  return new Promise((resolve, reject) => {
    const server = http.createServer(handleRequest)
    if (server.setTimeout) server.setTimeout(opts.timeout || defaultTimeout)
    server.listen(opts.port || port)
    if (opts.postgres) pgPool = new (require('pg')).Pool(opts.postgres)
    return resolve(server)
  })
}

// request handler
function handleRequest (req, res) {
  const getBody = getBodyParser(req)
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  const headers = (turbo ? req.getAllHeaders() : req.headers) || {}
  const header = (k) => turbo ? headers.get(k) : headers[k]

  const origin = header('origin')
  if (origin) {
    if (!allowOrigins[origin]) return rejectPreflight(res, origin)
    res.setHeader('Access-Control-Allow-Origin', origin)
  }
  if (req.method === 'OPTIONS' && header('access-control-request-method')) {
    return ackPreflight(res, origin, header('access-control-request-headers'))
  }

  const { name, action, id, params } = parseUrl(req)
  const resource = resources[name]
  if (!resource || !action) return fourOhFour(res)

  res.useGzip = (header('accept-encoding') || '').indexOf('gzip') !== -1
  if (setScrudHeader) res.setHeader('SCRUD', `${name}:${action}`)
  if (checkId[action]) req.id = id
  req.params = params
  if (getIp) {
    let connection = req.connection || {}
    req.params.ip = header('x-forwarded-for') || connection.remoteAddress
  }
  if (!turbo) req.once('error', (err) => sendErr(res, err))

  const callHandler = () => {
    if (!hasBody[action]) return actionHandler(req, res, name, action)
    return getBody().then((body) => {
      req.params = Object.assign(body, req.params)
      return actionHandler(req, res, name, action)
    }).catch((e) => sendErr(res, e))
  }

  const noAuth = !jwtOpts || (resource.skipAuth && resource.skipAuth[action])
  if (noAuth) return callHandler()

  const jwt = (header('authorization') || '').replace(/^Bearer\s/, '')
  authenticate(jwt).then((authData) => {
    req.auth = req.params.auth = authTrans ? authTrans(authData) : authData
    return callHandler()
  }).catch((err) => fourOhOne(res, err))
}

function sendData (res, data = null) {
  if (res.headersSent || res.headerSent) {
    logIt(new Error(`Can't send data after headers sent`), 'warn')
    return Promise.resolve()
  }

  res.statusCode = 200
  return new Promise((resolve, reject) => {
    const out = JSON.stringify({ data, error: null })
    const dblLen = (out.length * 2) + 1
    const big = !(dblLen < gzipThreshold || Buffer.byteLength(out) < gzipThreshold)
    if (!res.useGzip || !big) {
      res.end(out)
      return resolve()
    }

    res.setHeader('Content-Encoding', 'gzip')
    zlib.gzip(Buffer.from(out), (err, zipd) => {
      if (err) return reject(sendErr(res, err))
      res.end(zipd)
      return resolve()
    })
  })
}

function sendErr (res, err, code = 500) {
  res.statusCode = code
  if (res.headersSent || res.headerSent) {
    logIt(err || new Error(`Can't send error after headers sent`), 'warn')
    return Promise.resolve()
  } else {
    if (res.removeHeader) res.removeHeader('content-encoding')
  }

  if (!err) {
    res.end(JSON.stringify({ data: null, error: 'Unspecified error' }))
    return Promise.resolve()
  }

  return new Promise((resolve, reject) => {
    logIt(err, 'fatal')
    err = err instanceof Error ? (err.message || err.name) : err.toString()
    res.end(JSON.stringify({ data: null, error: err }))
    return resolve()
  })
}

function fourOhOne (res, err = new Error(`Unable to authenticate request`)) {
  return sendErr(res, err, 401)
}

function fourOhFour (res, err = new Error(`No match for requested route`)) {
  return sendErr(res, err, 404)
}

function ackPreflight (res, origin, allowHeaders) {
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
  if (allowHeaders) res.setHeader('Access-Control-Allow-Headers', allowHeaders)
  res.statusCode = 200
  res.end()
}

function rejectPreflight (res, origin) {
  res.setHeader('Origin', origin || '')
  res.statusCode = 403
  res.end(JSON.stringify({ data: null, error: 'Origin not allowed' }))
}

function genToken (payload = {}, opts) {
  opts = opts ? Object.assign({}, jwtOpts, opts) : jwtOpts
  const key = opts.secret || opts.privateKey
  const noOpts = () => new Error('Missing required jsonwebtoken opts')
  if (!opts || !key) return Promise.reject(noOpts())

  const signOpts = filterObj(opts, wlSign)
  return new Promise((resolve, reject) => {
    jsonwebtoken.sign(payload, key, signOpts, (err, token) => {
      return err ? reject(err) : resolve(token)
    })
  })
}

function authenticate (jwt, opts) {
  opts = opts ? Object.assign({}, jwtOpts, opts) : jwtOpts
  const key = (opts || {}).secret || (opts || {}).publicKey
  if (!opts || !key) return Promise.resolve()

  return new Promise((resolve, reject) => {
    jsonwebtoken.verify(jwt, key, opts, (err, d = {}) => {
      return err ? reject(err) : resolve(d)
    })
  })
}

// helper: handle all resource helpers
function pgActions (resource, action, req) {
  const { id, params } = req
  if (checkId[action]) {
    if (!id && id !== 0) return Promise.reject(new Error('No id passed'))
    if (action === 'read') params.id_array = [id]
    params.id = id
  }

  if (action === 'search') {
    Object.keys(params).forEach((k) => {
      if (!Array.isArray(params[k])) return
      params[`${k}_array`] = params[k]
    })
  }

  const funcName = `${pgPrefix}${resource}_${action}`
  if (!useFirstRecord[action]) return callPgFunc(funcName, params, req)
  return callPgFunc(funcName, params, req).then(firstRecord)
}

// default handler for all resource methods
function actionHandler (req, res, name, action, skipRes) {
  const rsrc = resources[name]
  res = res || dummyRes

  // prep beforeQuery handler
  let bq = rsrc.beforeQuery || {} // (req, res)
  if (typeof bq !== 'function') bq = bq[action]

  const act = () => rsrc[action]
    ? rsrc[action](req, res, name, action, skipRes)
    : handlers[action](name, req)

  if (rsrc[action]) return bq ? bq(req, res).then(act) : act()

  // prep beforeSend handler
  let bs = rsrc.beforeSend || {} // (req, res, data)
  if (typeof bs !== 'function') bs = bs[action]

  const send = (d) => skipRes ? Promise.resolve(d) : sendData(res, d)
  const finish = (d) => bs ? bs(req, res, d).then(send) : send(d)
  const run = () => bq ? bq(req, res).then(act).then(finish) : act().then(finish)
  const handleErr = (e) => skipRes ? Promise.reject(e) : sendErr(res, e)

  return run().catch(handleErr)
}
