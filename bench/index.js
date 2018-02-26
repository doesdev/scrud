'use strict'

const { fork } = require('child_process')
const { join } = require('path')
const getScrud = require('get-scrud')
const autocannon = require('autocannon')
const table = require('tty-table')
const ports = {http: 3010, fastify: 3011, polka: 3012, scrud: 3013, express: 3014}
const results = []
const benchId = 301
const children = {}
const memory = {}
let lob = process.argv[2] === '--lob' || process.argv[2] === 'lob'
Promise.all(Object.keys(ports).map((k) => new Promise((resolve, reject) => {
  let child = children[k] = fork(join(__dirname, 'server'), [k, lob ? 'lob' : ''])
  child.once('error', (err) => {
    console.log(err)
    process.exit()
  })
  let started
  let gotMemory
  child.on('message', (m) => {
    let endMem = m.match(/^endMem(.*)/)
    if (endMem) {
      memory[k].end = endMem[1]
      child.kill()
    }
    started = started || m === k
    let startMem = m.match(/^startMem(.*)/)
    gotMemory = gotMemory || startMem
    if (startMem) memory[k] = {start: startMem[1]}
    if (gotMemory && started) return resolve()
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
  let dm = 2
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
    connections: lob ? 10 : 50,
    pipelining: lob ? 1 : 10,
    headers: {'accept-encoding': 'gzip, deflate, br'}
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

const getEndMemory = (name) => new Promise((resolve, reject) => {
  children[name].on('exit', () => resolve())
  children[name].send('endMemory')
})

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
  for (let name of keys) await getEndMemory(name)
  let head = [
    {alias: 'lib', width: 12},
    {alias: 'req/sec', width: 12},
    {alias: 'latency', width: 12},
    {alias: 'throughput', width: 14},
    {alias: 'errors', width: 11},
    {alias: 'memory (start)'},
    {alias: 'memory (end)'}
  ].map((h) => Object.assign({paddingLeft: 0, paddingRight: 0}, h))
  results.sort((a, b) => b.requests.average - a.requests.average)
  let rows = results.map((r) => [
    r.title,
    r.requests.average,
    r.latency.average,
    formatBytes(r.throughput.average),
    r.errors + r.non2xx,
    memory[r.title].start.split('/').map(formatBytes).join('\n'),
    memory[r.title].end.split('/').map(formatBytes).join('\n')
  ])
  console.log(table(head, rows).render())
  process.exit()
}
