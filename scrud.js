'use strict'

// setup
const http = require('http')
const Pg = require('pg').Pool
const jsonwebtoken = require('jsonwebtoken')
const tinyParams = require('tiny-params')
const port = process.env.PORT || process.env.port || 8091
const handlers = {
  search: (name, req) => findAll(name, req.params),
  create: (name, req) => create(name, req.params),
  read: (name, req) => find(name, req.id, req.params),
  update: (name, req) => save(name, req.id, req.params),
  delete: (name, req) => destroy(name, req.id, req.params)
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
let logger
let pgPool
let jwtOpts
let authTrans
let pgPrefix = ''
let base = ''
let baseRgx = new RegExp(`^/?${base}/`)
let maxBodyBytes = 1e6
let resources = {}

// local helpers
const logIt = (e) => typeof logger === 'function' ? logger(e) : console.log(e)

const cleanPath = (url) => {
  return decodeURIComponent(url).replace(baseRgx, '').replace(/\/$/, '')
}

const parseId = (url) => {
  let id = (url.match(/\/(.+?)(\/|\?|$)/) || [])[1]
  return (id || '').match(/^\d+$/) ? parseInt(id, 10) : id || null
}

const callPgFunc = (name, params) => {
  let q = `SELECT * FROM ${name}($1);`
  if (!pgPool) return Promise.reject(new Error('no database configured'))
  return new Promise((resolve, reject) => {
    pgPool.connect((err, client, done) => {
      if (err) return reject(err)
      client.query(q, [params], (err, result) => {
        done(err)
        if (err) return reject(err)
        resolve((result.rows[0] || {})[name] ? result.rows[0][name] : [])
      })
    })
  })
}

const bodyParse = (req) => new Promise((resolve, reject) => {
  let body = ''
  req.on('data', (d) => {
    body += d.toString()
    if (body.length > maxBodyBytes) return reject(new Error('body too large'))
  })
  req.on('end', () => resolve(body ? JSON.parse(body) : {}))
})

const noIdErr = () => JSON.stringify(new Error('no id passed'))

const filterObj = (obj, ary) => {
  let base = {}
  ary.forEach((o) => { base[o] = obj[o] })
  return base
}

// exports
module.exports = {
  register,
  start,
  sendData,
  sendErr,
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
  if (!name) return Promise.reject(new Error(`no name specified in register`))
  return new Promise((resolve, reject) => {
    let r = resources[name] = Object.assign(opts, {name})
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
  baseRgx = new RegExp(`^/?${base}/`)
  return new Promise((resolve, reject) => {
    let server = http.createServer(handleRequest)
    server.listen(opts.port || port)
    if (opts.postgres) pgPool = new Pg(opts.postgres)
    return resolve(server)
  })
}

// request handler
function handleRequest (req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  if (!baseRgx.test(req.url)) return fourOhFour(res)
  let url = cleanPath(req.url)
  let matches = url.match(/^\/?(.+?)(\/|\?|$)/) || []
  let resource = resources[matches[1] || '']
  let modifier = matches[2]
  let action = scrud[`${req.method}${modifier}`]
  if (!resource || !action) return fourOhFour(res)
  let name = resource.name
  res.setHeader('SCRUD', `${name}:${action}`)
  req.id = parseId(url)
  req.params = tinyParams(url)
  let headers = req.headers || {}
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
    logIt(new Error(`can't send data after headers sent`), 'warn')
    return Promise.resolve()
  }
  return new Promise((resolve, reject) => {
    res.end(JSON.stringify({data, error: null}))
    return resolve()
  })
}

function sendErr (res, err, code = 500) {
  res.statusCode = code
  if (res.headersSent) {
    logIt(err || new Error(`can't send error after headers sent`), 'warn')
    return Promise.resolve()
  }
  if (!err) {
    res.end(JSON.stringify({data: null, error: 'unspecified error'}))
    return Promise.resolve()
  }
  return new Promise((resolve, reject) => {
    logIt(err, 'fatal')
    err = err instanceof Error ? (err.message || err.name) : err.toString()
    res.end(JSON.stringify({data: null, error: err}))
    return resolve()
  })
}

function fourOhOne (res, err = new Error(`unable to auhenticate request`)) {
  return sendErr(res, err, 401)
}

function fourOhFour (res, err = new Error(`no match for requested route`)) {
  return sendErr(res, err, 404)
}

function genToken (payload = {}) {
  let key = jwtOpts.secret || jwtOpts.privateKey
  let noOpts = () => new Error('missing required jsonwebtoken opts')
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

// helper: find resource
function find (resource, id, params) {
  if (!id && id !== 0) return Promise.reject(noIdErr())
  params.id_array = [id]
  let firstRecord = (d) => Promise.resolve(d[0])
  return callPgFunc(`${pgPrefix}${resource}_read`, params).then(firstRecord)
}

// helper: find set of resources
function findAll (resource, params) {
  Object.keys(params).forEach((k) => {
    if (!Array.isArray(params[k])) return
    params[`${k}_array`] = params[k]
    delete params[k]
  })
  return callPgFunc(`${pgPrefix}${resource}_search`, params)
}

// helper: create resource
function create (resource, params) {
  let firstRecord = (d) => Promise.resolve(d[0])
  return callPgFunc(`${pgPrefix}${resource}_create`, params).then(firstRecord)
}

// helper: update resource
function save (resource, id, params) {
  if (!id && id !== 0) return Promise.reject(noIdErr())
  params.id = id
  let firstRecord = (d) => Promise.resolve(d[0])
  return callPgFunc(`${pgPrefix}${resource}_update`, params).then(firstRecord)
}

// helper: delete resource
function destroy (resource, id, params) {
  if (!id && id !== 0) return Promise.reject(noIdErr())
  params.id = id
  return callPgFunc(`${pgPrefix}${resource}_delete`, params)
}

// default handler for all resource methods
function actionHandler (req, res, name, action) {
  let bq = resources[name].beforeQuery || {} // (req, res)
  if (typeof bq !== 'function') bq = bq[action]
  let bs = resources[name].beforeSend || {} // (req, res, data)
  if (typeof bs !== 'function') bs = bs[action]
  let act = () => handlers[action](name, req)
  let send = (d) => sendData(res, d)
  let finish = (d) => bs ? bs(req, res, d).then((d) => send(d)) : send(d)
  let run = () => bq ? bq(req, res).then(act).then(finish) : act().then(finish)
  return run().catch((e) => sendErr(res, e))
}
