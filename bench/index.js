'use strict'

const { fork } = require('child_process')
const { join } = require('path')
const getScrud = require('get-scrud')
const autocannon = require('autocannon')
const table = require('tty-table')
const ports = {http: 3010, fastify: 3011, polka: 3012, scrud: 3013, express: 3014}
const results = []
const benchId = 301
Promise.all(Object.keys(ports).map((k) => new Promise((resolve, reject) => {
  let child = fork(join(__dirname, 'server'), [k])
  child.once('error', (err) => {
    console.log(err)
    process.exit()
  })
  child.once('message', (m) => {
    (m === k) ? resolve() : reject(m)
  })
}))).then(() => bench())

const urlTemplate = (port, string) => {
  let url = {host: 'localhost', port, path: `/bench/${benchId}`}
  return string ? `http://${url.host}:${url.port}${url.path}` : url
}

const shuffler = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1))
    var temp = array[i]
    array[i] = array[j]
    array[j] = temp
  }
  return array
}

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Byte'
  let k = 1000
  let dm = 3
  let sizes = ['Bytes', 'KB', 'MB', 'GB']
  let i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

// benchamrks
const bencher = (title) => new Promise((resolve, reject) => {
  console.log(`benchmarking ${title}`)
  let port = ports[title]
  let done = (err, res) => {
    if (err) return reject(err)
    results.push(res)
    return resolve(title)
  }
  let acOpts = {
    url: urlTemplate(port, true),
    title,
    connections: 50,
    pipelining: 10
  }
  autocannon(Object.assign({duration: 3}, acOpts), () => {
    autocannon(Object.assign({duration: 7}, acOpts), done)
  })
})

let last = {}
const checkConsistency = async (name) => {
  let port = ports[name]
  let { read } = getScrud(urlTemplate(port))
  let tmpRes = await read('bench', benchId)
  if (!tmpRes || (last.lib && last.result !== tmpRes)) {
    let err = new Error(`Got inconsistent results from libraries`)
    err.meta = [`${last.lib} - ${last.result}`, `${name} - ${tmpRes}`]
    throw err
  }
  last = {lib: name, result: tmpRes}
}

async function bench () {
  console.log(`servers running, starting benchmarks\n`)
  let keys = shuffler(Object.keys(ports))
  for (let name of keys) {
    try {
      await checkConsistency(name)
    } catch (ex) {
      console.log(ex, name)
      process.exit()
    }
  }
  for (let name of keys) await bencher(name)
  let head = ['lib', 'req/sec', 'latency', 'throughput', 'errors'].map((h) => {
    return {alias: h}
  })
  results.sort((a, b) => b.requests.average - a.requests.average)
  let rows = results.map((r) => [
    r.title,
    r.requests.average,
    r.latency.average,
    formatBytes(r.throughput.average),
    r.errors + r.non2xx
  ])
  console.log(table(head, rows).render())
  process.exit()
}
