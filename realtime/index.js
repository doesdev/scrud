'use strict'

const { join } = require('path')
const ngoOpts = { goPath: join(__dirname, 'gopath') }
const ngo = require('ngo')
const EMITTER_LISTEN = `:6788`
let broker

async function startBroker (brokerOpts = { EMITTER_LISTEN }) {
  await ngo(ngoOpts)(['get', 'github.com/emitter-io/emitter'])
  let emitter = ngo(ngoOpts).bin('emitter')
  let { stderr } = await emitter()
  brokerOpts.EMITTER_LICENSE = stderr.match(/license: (.+)/)[1]
  // let key = stderr.match(/key: (.+)/)[1]
  let getBroker = () => {
    broker = ngo(Object.assign({ env: brokerOpts }, ngoOpts)).bin('emitter')()
    broker.on('exit', getBroker)
  }
  getBroker()
}

startBroker()
