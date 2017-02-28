'use strict'

// setup
const http = require('http')
const Pg = require('pg').Pool
const jsonwebtoken = require('jsonwebtoken')
const tinyParams = require('tiny-params')
const port = process.env.PORT || process.env.port || 8091
const handlers = {
  search: resourceSearch,
  create: resourceCreate,
  read: resourceRead,
  update: resourceUpdate,
  delete: resourceDelete
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

// globals
let logger
let pgPool
let jwtOpts
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

const sendData = (res, data) => {
  return res.end(`{"data": ${JSON.stringify(data)}, "error": null}`)
}

const sendErr = (res, err = new Error(), code = 500) => {
  res.code = code
  logIt(err, 'fatal')
  err = err instanceof Error ? (err.message || err.name) : err.toString()
  return res.end(`{"data": null, "error": "${err}"}`)
}

const fourOhOne = (res, err = new Error(`unable to auhenticate request`)) => {
  return sendErr(res, err, 401)
}

const fourOhFour = (res, err = new Error(`no match for requested route`)) => {
  return sendErr(res, err, 404)
}

const noIdErr = () => JSON.stringify(new Error('no id passed'))

// exports
module.exports = {
  register,
  start,
  _find,
  _findAll,
  _create,
  _save,
  _destroy
}

// register resource
function register (name, opts = {}) {
  if (!name) return Promise.reject(new Error(`no name specified in register`))
  return new Promise((resolve, reject) => {
    let r = resources[name] = Object.assign(opts, {name})
    return resolve(r)
  })
}

// start server
function start (opts = {}) {
  if (opts.namespace) pgPrefix = `${opts.namespace.toLowerCase()}_`
  if (opts.maxBodyBytes) maxBodyBytes = opts.maxBodyBytes
  if (opts.jsonwebtoken) jwtOpts = opts.jsonwebtoken
  if (opts.logger) base = opts.logger
  if (opts.base) base = opts.base
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
  if (!baseRgx.test(req.url)) return fourOhFour(res)
  let url = cleanPath(req.url)
  let matches = url.match(/^\/?(.+?)(\/|\?|$)/) || []
  let resource = resources[matches[1] || '']
  let modifier = matches[2]
  let action = scrud[`${req.method}${modifier}`]
  if (!resource || !action) return fourOhFour(res)
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('SCRUD', `${resource.name}:${action}`)
  req.id = parseId(url)
  req.params = tinyParams(url)
  req.once('error', (err) => sendErr(res, err))
  let handler = (resource[action] || handlers[action])
  let jwt = (req.headers.authorization || '').replace(/^Bearer\s/, '')
  authenticate(jwt).then((authData) => {
    req.auth = authData
    handler(req, res, resource.name)
  }).catch((err) => fourOhOne(res, err))
}

function authenticate (jwt) {
  let key = jwtOpts.secret || jwtOpts.publicKey
  if (!jwtOpts || !key) return Promise.resolve()
  return new Promise((resolve, reject) => {
    jsonwebtoken.verify(jwt, key, jwtOpts, (err, decoded) => {
      return err ? reject(err) : resolve(decoded)
    })
  })
}

// helper: find resource
function _find (resource, id) {
  if (!id && id !== 0) return Promise.reject(noIdErr())
  let params = {id_array: [id]}
  let firstRecord = (d) => Promise.resolve(d[0])
  return callPgFunc(`${pgPrefix}${resource}_read`, params).then(firstRecord)
}

// helper: find set of resources
function _findAll (resource, params) {
  Object.keys(params).forEach((k) => {
    if (!Array.isArray(params[k])) return
    params[`${k}_array`] = params[k]
    delete params[k]
  })
  return callPgFunc(`${pgPrefix}${resource}_search`, params)
}

// helper: create resource
function _create (resource, attrs) {
  let firstRecord = (d) => Promise.resolve(d[0])
  return callPgFunc(`${pgPrefix}${resource}_create`, attrs).then(firstRecord)
}

// helper: update resource
function _save (resource, id, attrs) {
  if (!id && id !== 0) return Promise.reject(noIdErr())
  attrs.id = id
  let firstRecord = (d) => Promise.resolve(d[0])
  return callPgFunc(`${pgPrefix}${resource}_update`, attrs).then(firstRecord)
}

// helper: delete resource
function _destroy (resource, id) {
  if (!id && id !== 0) return Promise.reject(noIdErr())
  return callPgFunc(`${pgPrefix}${resource}_delete`, {id})
}

// resource method: search
function resourceSearch (req, res, name) {
  _findAll(name, req.params).then((d) => {
    return sendData(res, d)
  }).catch((e) => sendErr(res, e))
}

// resource method: create
function resourceCreate (req, res, name) {
  bodyParse(req).then((body) => {
    req.params = Object.assign(body, req.params)
    _create(name, req.params).then((d) => {
      return sendData(res, d)
    }).catch((err) => sendErr(res, err))
  })
}

// resource method: read
function resourceRead (req, res, name) {
  _find(name, req.id).then((d) => {
    return sendData(res, d)
  }).catch((err) => sendErr(res, err))
}

// resource method: update
function resourceUpdate (req, res, name) {
  bodyParse(req).then((body) => {
    req.params = Object.assign(body, req.params)
    _save(name, req.id, req.params).then((d) => {
      return sendData(res, d)
    }).catch((err) => sendErr(res, err))
  })
}

// resource method: delete
function resourceDelete (req, res, name) {
  _destroy(name, req.id).then((d) => {
    return sendData(res, 'success')
  }).catch((err) => sendErr(res, err))
}
