'use strict'

// setup
const scrud = require('./scrud')

// exports
module.exports = scrud
module.exports.instance = () => {
  delete require.cache[require.resolve('./scrud')]
  return require('./scrud')
}
