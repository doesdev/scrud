'use strict'

const { register, start, sendData } = require('./index')
const port = 1234
const allowOrigins = ['http://localhost:1234']
const config = { port, allowOrigins, useNotModified: true }

const search = async (req, res) => {
  return sendData(res, { hello: 'world' }, req)
}

async function main () {
  await register('search', { search })
  await start(config).then(() => console.log('YMMV Deals API running'))
}

main()
