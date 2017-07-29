'use strict'

// setup
const http = require('http')
const { Pool } = require('pg')
const jsonwebtoken = require('jsonwebtoken')
const tinyParams = require('tiny-params')
const zlib = require('zlib')
const port = process.env.PORT || process.env.port || 8091
const defaultTimeout = 120000
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
let logger
let pgPool
let jwtOpts
let authTrans
let pgPrefix = ''
let base = ''
let baseRgx = new RegExp(`^/?${base}/`)
let maxBodyBytes = 1e6
let resources = {}
let allowOrigins = {}
let gzipThreshold = 1000

// local helpers
const logIt = (e, level = 'fatal') => {
  typeof logger === 'function' ? logger(e, level) : console.log(e)
}

const cleanPath = (url) => {
  return decodeURIComponent(url).replace(baseRgx, '').replace(/\/$/, '')
}

const parseId = (url) => {
  let id = (url.match(/\/(.+?)(\/|\?|$)/) || [])[1]
  id = (id || '').match(/^\d+$/) ? parseInt(id, 10) : id || null
  return id === 'null' || id === 'undefined' ? null : id
}

const callPgFunc = (name, params) => {
  let q = `SELECT * FROM ${name}($1);`
  if (!pgPool) return Promise.reject(new Error('No database configured'))
  return pgPool.connect().then((client) => {
    return client.query(q, [params]).then((data) => {
      client.release()
      return Promise.resolve((data.rows[0] || {})[name] || [])
    }).catch((err) => {
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
    return err
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
  ary.forEach((o) => { base[o] = obj[o] })
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
  create,
  save,
  destroy
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
  if (opts.jsonwebtoken) jwtOpts = opts.jsonwebtoken
  if (opts.logger) logger = opts.logger
  if (opts.base) base = opts.base
  if (opts.authTrans) authTrans = opts.authTrans
  if (opts.gzipThreshold) gzipThreshold = opts.gzipThreshold
  if (Array.isArray(opts.allowOrigins)) {
    opts.allowOrigins.forEach((k) => { allowOrigins[k] = true })
  }
  baseRgx = new RegExp(`^/?${base}/`)
  return new Promise((resolve, reject) => {
    let server = http.createServer(handleRequest)
    server.setTimeout(opts.timeout || defaultTimeout)
    server.listen(opts.port || port)
    if (opts.postgres) pgPool = new Pool(opts.postgres)
    return resolve(server)
  })
}

// request handler
function handleRequest (req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  let headers = req.headers || {}
  let origin = headers['origin']
  if (origin && !allowOrigins[origin]) return rejectPreflight(res, origin)
  if (origin) res.setHeader('Access-Control-Allow-Origin', origin)
  if (req.method === 'OPTIONS' && headers['access-control-request-method']) {
    return ackPreflight(res, origin, headers['access-control-request-headers'])
  }
  if (!baseRgx.test(req.url)) return fourOhFour(res)
  let url = cleanPath(req.url)
  let matches = url.match(/^\/?(.+?)(\/|\?|$)/) || []
  let resource = resources[matches[1] || '']
  let modifier = matches[2]
  let action = scrud[`${req.method}${modifier}`]
  if (!resource || !action) return fourOhFour(res)
  let name = resource.name
  if ((headers['accept-encoding'] || '').match('gzip')) {
    res.setHeader('Content-Encoding', 'gzip')
  }
  res.setHeader('SCRUD', `${name}:${action}`)
  req.id = parseId(url)
  req.params = tinyParams(url)
  let connection = req.connection || {}
  req.params.ip = headers['x-forwarded-for'] || connection.remoteAddress
  req.once('error', (err) => sendErr(res, err))
  let handler = resource[action] || actionHandler
  let jwt = (headers.authorization || '').replace(/^Bearer\s/, '')
  let callHandler = () => {
    if (!hasBody[action]) return handler(req, res, name, action)
    return bodyParse(req).then((body) => {
      req.params = Object.assign(body, req.params)
      return handler(req, res, name, action)
    }).catch((e) => sendErr(res, e))
  }
  if (resource.skipAuth && resource.skipAuth[action]) return callHandler()
  authenticate(jwt).then((authData) => {
    req.auth = req.params.auth = authTrans ? authTrans(authData) : authData
    return callHandler()
  }).catch((err) => fourOhOne(res, err))
}

function sendData (res, data = null) {
  if (res.headersSent) {
    logIt(new Error(`Can't send data after headers sent`), 'warn')
    return Promise.resolve()
  }
  return new Promise((resolve, reject) => {
    data = JSON.stringify({data, error: null})
    let len = Buffer.byteLength(data)
    res.statusCode = 200
    if (res.getHeader('content-encoding') !== 'gzip' || len < gzipThreshold) {
      res.removeHeader('content-encoding')
      res.end(data)
      return resolve()
    }
    zlib.gzip(Buffer.from(data), (err, zipd) => {
      if (err) return reject(sendErr(res, err))
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
  let key = jwtOpts.secret || jwtOpts.publicKey
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
  let checkId = {read: true, update: true, delete: true}
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
  if (!first[action]) return callPgFunc(funcName, params)
  return callPgFunc(funcName, params).then(firstRecord)
}

// default handler for all resource methods
function actionHandler (req, res, name, action) {
  let bq = resources[name].beforeQuery || {} // (req, res)
  if (typeof bq !== 'function') bq = bq[action]
  let bs = resources[name].beforeSend || {} // (req, res, data)
  if (typeof bs !== 'function') bs = bs[action]
  let act = () => handlers[action](name, req)
  let send = (d) => sendData(res, d)
  let finish = (d) => bs ? bs(req, res, d).then(send) : send(d)
  let run = () => bq ? bq(req, res).then(act).then(finish) : act().then(finish)
  return run().catch((e) => sendErr(res, e))
}
