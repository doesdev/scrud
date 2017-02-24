'use strict'

// setup

// exports
module.exports = {register, start, logger, _find, _findAll, _create, _save}

// register resource
function register (name, opts) {
  if (!name) return Promise.reject(new Error(`no name specified in register`))
  let r = {name}
  return r
}

// start server
function start () { return null }

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
