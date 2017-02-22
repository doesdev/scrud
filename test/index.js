'use strict'

// setup
import test from 'ava'

// test something
test.todo('testSomething')

/* API
const pattyOpts = {port: 8081, secret: 'someSecureString', logpath: '/logs'}
const patty = require('paternity')
const handleIt = require('./some-other-resource') // same as resource obj

const someResource = await patty.register('some-resource')
const someOtherResource = await patty.register('some-other-resource', handleIt)
await patty.start(pattyOpts)
*/

/* RESOURCE OBJECT
{
  name: 'some-resource',
  search: (req, res) => Promise.resolve('done'),
  create: (req, res) => Promise.resolve('done'),
  read: (req, res) => Promise.resolve('done'),
  update: (req, res) => Promise.resolve('done'),
  delete: (req, res) => Promise.resolve('done')
}
*/

/* GLOBAL HELPERS
const logger = patty.logger // {debug, info, warn, fatal}
let record = await patty._find('some-resource', {id: 1})
let records = await patty._findAll('some-resource', {name: 'jerry'})
let newRecord = await patty._create('some-resource', {name: 'jimmy'})
let updatedRecord = await patty._save('some-resource', {id: 1, name: 'john'})
*/
