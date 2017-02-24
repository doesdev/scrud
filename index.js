'use strict'

// setup
const uws = require('uws')
const http = uws.http
const port = process.env.PORT || process.env.port || 8091

// globals
let server

// exports
module.exports = {register, start, logger, _find, _findAll, _create, _save}

// register resource
function register (name, opts) {
  if (!name) return Promise.reject(new Error(`no name specified in register`))
  let r = {name}
  return r
}

// start server
function start (opts = {}) {
  return new Promise((resolve, reject) => {
    server = http.createServer(handleRequest)
    server.listen(opts.port || port)
    console.log(server)
    resolve(server)
  })
}

// request handler
function handleRequest (req, res) {
  console.log('got request')
  res.end(`world`)
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
