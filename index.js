'use strict'

// setup
const http = require('http')
const tinyParams = require('tiny-params')
const zlib = require('zlib')
const port = process.env.PORT || process.env.port || 8091
const defaultTimeout = 120000
const checkId = {read: true, update: true, delete: true}
const primitives = {string: true, number: true, boolean: true}
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
const hasBody = {create: true, update: true}
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
let noCache

// local helpers
const logIt = (e, level = 'fatal') => {
  typeof logger === 'function' ? logger(e, level) : console.log(e)
}

let lastParsed = {}
const parseUrl = (req) => {
  let tmp = lastParsed
  let sig = `${req.method}${req.url}`
  if (tmp.sig === sig) return tmp.data
  let url = decodeURIComponent(req.url).slice(baseChars)
  let sIdx = url.indexOf('/')
  let qIdx = url.indexOf('?')
  let modIdx = (sIdx === -1 || (qIdx !== -1 && sIdx > qIdx)) ? qIdx : sIdx
  let lastIdx = url.length - 1
  let id
  if (sIdx === modIdx) {
    let postMod = url.slice(sIdx + 1)
    if (postMod) {
      let nextMod = postMod.indexOf('/')
      if (nextMod === -1) nextMod = postMod.indexOf('?')
      id = nextMod === -1 ? postMod : postMod.slice(0, nextMod)
    }
  }
  let noMod = modIdx === -1
  let name = noMod ? url : url.slice(0, modIdx)
  let modifier = noMod || modIdx === lastIdx ? '' : url.charAt(modIdx)
  let action = scrud[`${req.method}${modifier}`]
  let params = tinyParams(url)
  let data = { url, name, action, id, params }
  lastParsed = { sig, data }
  return data
}

const callPgFunc = (name, params, req) => {
  let q = `SELECT * FROM ${name}($1);`
  if (!pgPool) return Promise.reject(new Error('No database configured'))
  return pgPool.connect().then((client) => {
    let close = () => { if (client && client.end) client.end().catch(() => {}) }
    if (req && req.on) req.once('close', close)
    return client.query(q, [params]).then((data) => {
      if (req && req.removeListener) req.removeListener('close', close)
      client.release()
      return Promise.resolve((data.rows[0] || {})[name] || [])
    }).catch((err) => {
      if (req && req.removeListener) req.removeListener('close', close)
      client.release()
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
  req.on('data', (d) => {
    body += d.toString()
    if (body.length > maxBodyBytes) return reject(new Error('Body too large'))
  })
  let parse = () => {
    try { resolve(body ? JSON.parse(body) : {}) } catch (ex) { resolve({}) }
  }
  req.on('end', parse)
})

const filterObj = (obj, ary) => {
  let base = {}
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
    let r = resources[name] = Object.assign({}, opts, {name})
    if (Array.isArray(r.skipAuth)) {
      let skippers = {}
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
  if (opts.noCache) noCache = true
  if (opts.setScrudHeader) setScrudHeader = true
  if (opts.authTrans) authTrans = opts.authTrans
  if (opts.gzipThreshold) gzipThreshold = opts.gzipThreshold
  if (Array.isArray(opts.allowOrigins)) {
    opts.allowOrigins.forEach((k) => { allowOrigins[k] = true })
  }
  return new Promise((resolve, reject) => {
    let server = http.createServer(handleRequest)
    server.setTimeout(opts.timeout || defaultTimeout)
    server.listen(opts.port || port)
    if (opts.postgres) pgPool = new (require('pg')).Pool(opts.postgres)
    return resolve(server)
  })
}

// request handler
function handleRequest (req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  let headers = req.headers || {}
  let origin = headers['origin']
  if (origin) {
    if (!allowOrigins[origin]) return rejectPreflight(res, origin)
    res.setHeader('Access-Control-Allow-Origin', origin)
  }
  if (req.method === 'OPTIONS' && headers['access-control-request-method']) {
    return ackPreflight(res, origin, headers['access-control-request-headers'])
  }
  let { name, action, id, params } = parseUrl(req)
  let resource = resources[name]
  if (!resource || !action) return fourOhFour(res)
  res.useGzip = (headers['accept-encoding'] || '').indexOf('gzip') !== -1
  if (setScrudHeader) res.setHeader('SCRUD', `${name}:${action}`)
  if (checkId[action]) req.id = id
  req.params = params
  if (getIp) {
    let connection = req.connection || {}
    req.params.ip = headers['x-forwarded-for'] || connection.remoteAddress
  }
  req.once('error', (err) => sendErr(res, err))
  let callHandler = () => {
    if (!hasBody[action]) return actionHandler(req, res, name, action)
    return bodyParse(req).then((body) => {
      req.params = Object.assign(body, req.params)
      return actionHandler(req, res, name, action)
    }).catch((e) => sendErr(res, e))
  }
  let noAuth = !jwtOpts || (resource.skipAuth && resource.skipAuth[action])
  if (noAuth) return callHandler()
  let jwt = (headers.authorization || '').replace(/^Bearer\s/, '')
  authenticate(jwt).then((authData) => {
    req.auth = req.params.auth = authTrans ? authTrans(authData) : authData
    return callHandler()
  }).catch((err) => fourOhOne(res, err))
}

let sendCache = {}
function sendData (res, data = null) {
  if (res.headersSent) {
    logIt(new Error(`Can't send data after headers sent`), 'warn')
    return Promise.resolve()
  }
  let tmp = sendCache
  let canCache = !noCache && (!data || primitives[typeof data])
  let hasCache = canCache && data === tmp.data
  return new Promise((resolve, reject) => {
    let out = hasCache ? tmp.out : JSON.stringify({data, error: null})
    let len = hasCache ? tmp.len : Buffer.byteLength(out)
    if (canCache && !hasCache) sendCache = {data, out, len}
    res.statusCode = 200
    if (!res.useGzip || len < gzipThreshold) {
      res.end(out)
      return resolve()
    }
    res.setHeader('Content-Encoding', 'gzip')
    if (tmp.gzip) {
      res.end(tmp.gzip)
      return resolve()
    }
    zlib.gzip(Buffer.from(out), (err, zipd) => {
      if (err) return reject(sendErr(res, err))
      if (canCache && !hasCache) sendCache.gzip = zipd
      res.end(zipd)
      return resolve()
    })
  })
}

function sendErr (res, err, code = 500) {
  res.statusCode = code
  if (res.headersSent) {
    logIt(err || new Error(`Can't send error after headers sent`), 'warn')
    return Promise.resolve()
  } else {
    res.removeHeader('content-encoding')
  }
  if (!err) {
    res.end(JSON.stringify({data: null, error: 'Unspecified error'}))
    return Promise.resolve()
  }
  return new Promise((resolve, reject) => {
    logIt(err, 'fatal')
    err = err instanceof Error ? (err.message || err.name) : err.toString()
    res.end(JSON.stringify({data: null, error: err}))
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
  res.end(JSON.stringify({data: null, error: 'Origin not allowed'}))
}

function genToken (payload = {}) {
  let key = jwtOpts.secret || jwtOpts.privateKey
  let noOpts = () => new Error('Missing required jsonwebtoken opts')
  if (!jwtOpts || !key) return Promise.reject(noOpts())
  let opts = filterObj(jwtOpts, wlSign)
  return new Promise((resolve, reject) => {
    jsonwebtoken.sign(payload, key, opts, (err, token) => {
      return err ? reject(err) : resolve(token)
    })
  })
}

function authenticate (jwt) {
  let key = (jwtOpts || {}).secret || (jwtOpts || {}).publicKey
  if (!jwtOpts || !key) return Promise.resolve()
  return new Promise((resolve, reject) => {
    jsonwebtoken.verify(jwt, key, jwtOpts, (err, d = {}) => {
      return err ? reject(err) : resolve(d)
    })
  })
}

// helper: handle all resource helpers
function pgActions (resource, action, req) {
  let {id, params} = req
  if (checkId[action]) {
    if (!id && id !== 0) return Promise.reject(new Error('No id passed'))
    if (action === 'read') params.id_array = [id]
    params.id = id
  }
  let firstRecord = (d) => Promise.resolve(d[0])
  let first = {create: true, read: true, update: true}
  if (action === 'search') {
    Object.keys(params).forEach((k) => {
      if (!Array.isArray(params[k])) return
      params[`${k}_array`] = params[k]
    })
  }
  let funcName = `${pgPrefix}${resource}_${action}`
  if (!first[action]) return callPgFunc(funcName, params, req)
  return callPgFunc(funcName, params, req).then(firstRecord)
}

// default handler for all resource methods
function actionHandler (req, res, name, action, skipRes) {
  let rsrc = resources[name]
  res = res || dummyRes
  let bq = rsrc.beforeQuery || {} // (req, res)
  if (typeof bq !== 'function') bq = bq[action]
  let act = () => rsrc[action]
      ? rsrc[action](req, res, name, action, skipRes)
      : handlers[action](name, req)
  if (rsrc[action]) return bq ? bq(req, res).then(act) : act()
  let bs = rsrc.beforeSend || {} // (req, res, data)
  if (typeof bs !== 'function') bs = bs[action]
  let send = (d) => skipRes ? Promise.resolve(d) : sendData(res, d)
  let finish = (d) => bs ? bs(req, res, d).then(send) : send(d)
  let run = () => bq ? bq(req, res).then(act).then(finish) : act().then(finish)
  let handleErr = (e) => skipRes ? Promise.reject(e) : sendErr(res, e)
  return run().catch(handleErr)
}
