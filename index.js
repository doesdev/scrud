'use strict'

// setup
const http = require('http')
const port = process.env.PORT || process.env.port || 8091
const scrud = {
  'GET?': 'search',
  POST: 'create',
  'GET/': 'read',
  'PUT/': 'update',
  'DELETE/': 'delete'
}

// globals
let server
let base = ''
let baseRgx = new RegExp(`^/?${base}/`)
let resourceRgx = new RegExp('a^')
let resources = {}

// helpers
const cleanPath = (url) => url.replace(baseRgx, '')
const getRgx = () => {
  return `^/?${base}/${Object.keys(resources).join(`|^/?${base}/`)}(\\/|\\?|$)`
}

// exports
module.exports = {register, start, logger, _find, _findAll, _create, _save}

// register resource
function register (name, opts) {
  if (!name) return Promise.reject(new Error(`no name specified in register`))
  return new Promise((resolve, reject) => {
    let r = resources[name] = {name}
    resourceRgx = new RegExp(getRgx())
    return resolve(r)
  })
}

// start server
function start (opts = {}) {
  base = opts.base
  baseRgx = new RegExp(`^/?${base}/`)
  resourceRgx = new RegExp(getRgx())
  return new Promise((resolve, reject) => {
    server = http.createServer(handleRequest)
    server.listen(opts.port || port)
    return resolve(server)
  })
}

// handle 404
function fourOhFour (res) {
  res.statusCode = 404
  res.end('no match for requested route')
}

// request handler
function handleRequest (req, res) {
  let url = req.url
  if (!resourceRgx.test(url)) return fourOhFour(res)
  let reqBase = cleanPath(url.match(resourceRgx)[0])
  let resource = reqBase.replace(/\/|\?/g, '')
  let modifier = (reqBase.match(/\/|\?$/) || [])[0] || ''
  let action = scrud[`${req.method}${modifier}`]
  if (!resource || !action) return fourOhFour(res)
  res.end(`${resource}:${action}`)
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
