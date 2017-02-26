'use strict'

// setup
const http = require('http')
const Pg = require('pg').Pool
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
let server
let pgPool
let pgPrefix = ''
let base = ''
let baseRgx = new RegExp(`^/?${base}/`)
let maxBodyBytes = 1e6
let resources = {}

// local helpers
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

// exports
module.exports = {register, start, logger, _find, _findAll, _create, _save}

// register resource
function register (name, opts) {
  if (!name) return Promise.reject(new Error(`no name specified in register`))
  return new Promise((resolve, reject) => {
    let r = resources[name] = {name}
    return resolve(r)
  })
}

// start server
function start (opts = {}) {
  if (opts.namespace) pgPrefix = `${opts.namespace.toLowerCase()}_`
  if (opts.maxBodyBytes) maxBodyBytes = opts.maxBodyBytes
  base = opts.base
  baseRgx = new RegExp(`^/?${base}/`)
  return new Promise((resolve, reject) => {
    server = http.createServer(handleRequest)
    server.listen(opts.port || port)
    if (opts.postgres) pgPool = new Pg(opts.postgres)
    return resolve(server)
  })
}

// handle 404
function fourOhFour (res) {
  res.statusCode = 404
  res.end(`{"error": "no match for requested route"}`)
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
  res.setHeader('SCRUD', `${resource.name}:${action}`)
  req.id = parseId(url)
  req.params = tinyParams(url)
  req.once('error', (err) => {
    return res.end(`{"data": null, "error": ${JSON.stringify(err)}}`)
  })
  return (resource[action] || handlers[action])(req, res, resource.name)
}

// return global logger
function logger () { return null }

// helper: find resource
function _find (resource, id) {
  let attrs = {id_array: [id]}
  let firstRecord = (d) => Promise.resolve(d[0])
  return callPgFunc(`${pgPrefix}${resource}_read`, attrs).then(firstRecord)
}

// helper: find set of resources
function _findAll () { return null }

// helper: create resource
function _create (resource, attrs) {
  let firstRecord = (d) => Promise.resolve(d[0])
  return callPgFunc(`${pgPrefix}${resource}_create`, attrs).then(firstRecord)
}

// helper: update resource
function _save () { return null }

// resource method: search
function resourceSearch (req, res, name) {
  return res.end(`{"data": [], "error": null}`)
}

// resource method: create
function resourceCreate (req, res, name) {
  bodyParse(req).then((body) => {
    req.params = Object.assign(body, req.params)
    _create(name, req.params).then((d) => {
      return res.end(`{"data": ${JSON.stringify(d)}, "error": null}`)
    }).catch((err) => {
      return res.end(`{"data": null, "error": ${JSON.stringify(err)}}`)
    })
  })
}

// resource method: read
function resourceRead (req, res, name) {
  if (!req.id && req.id !== 0) {
    return res.end(`{"data": null, "error": ${noIdErr()}}`)
  }
  _find(name, req.id).then((d) => {
    return res.end(`{"data": ${JSON.stringify(d)}, "error": null}`)
  }).catch((err) => {
    return res.end(`{"data": null, "error": ${JSON.stringify(err)}}`)
  })
}

// resource method: update
function resourceUpdate (req, res, name) {
  return res.end(`{"data": null, "error": null}`)
}

// resource method: delete
function resourceDelete (req, res, name) {
  return res.end(`{"data": null, "error": null}`)
}
