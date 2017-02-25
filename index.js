'use strict'

// setup
const http = require('http')
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
let base = ''
let baseRgx = new RegExp(`^/?${base}/`)
let resources = {}

// helpers
const cleanPath = (url) => {
  return decodeURIComponent(url).replace(baseRgx, '').replace(/\/$/, '')
}

const parseId = (url) => {
  let id = (url.match(/\/(.+?)(\/|\?|$)/) || [])[1]
  return (id || '').match(/^\d+$/) ? parseInt(id, 10) : id || null
}

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
  base = opts.base
  baseRgx = new RegExp(`^/?${base}/`)
  return new Promise((resolve, reject) => {
    server = http.createServer(handleRequest)
    server.listen(opts.port || port)
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
  return (resource[action] || handlers[action])(req, res, resource.name)
}

// return global logger
function logger () { return null }

// helper: find resource
function _find () { return null }

// helper: find set of resources
function _findAll () { return null }

// helper: create resource
function _create () { return null }

// helper: update resource
function _save () { return null }

// resource method: search
function resourceSearch (req, res, name) {
  return res.end(`{"data": [], "error": null}`)
}

// resource method: create
function resourceCreate (req, res, name) {
  return res.end(`{"data": null, "error": null}`)
}

// resource method: read
function resourceRead (req, res, name) {
  return res.end(`{"data": null, "error": null}`)
}

// resource method: update
function resourceUpdate (req, res, name) {
  return res.end(`{"data": null, "error": null}`)
}

// resource method: delete
function resourceDelete (req, res, name) {
  return res.end(`{"data": null, "error": null}`)
}
