'use strict'

const { fork } = require('child_process')
const { join } = require('path')
const { writeFileSync } = require('fs')
const { get } = require('axios')
const autocannon = require('autocannon')
const table = require('tty-table')
const warmupSec = 3
const runSec = 7
const ports = {
  http: 3010,
  fastify: 3011,
  polka: 3012,
  scrud: 3013,
  express: 3014,
  hapi: 3015
}
const results = []
const benchId = 301
const children = {}
const memory = {}

const lob = process.argv[2] === '--lob' || process.argv[2] === 'lob'

Promise.all(Object.keys(ports).map((k) => new Promise((resolve, reject) => {
  const child = children[k] = fork(join(__dirname, 'server'), [k, lob ? 'lob' : ''])
  child.once('error', (err) => {
    console.log(err)
    process.exit()
  })

  let started
  let gotMemory
  child.on('message', (m) => {
    const endMem = m.match(/^endMem(.*)/)
    if (endMem) {
      memory[k].end = endMem[1]
      child.kill()
    }

    started = started || m === k
    const startMem = m.match(/^startMem(.*)/)
    gotMemory = gotMemory || startMem

    if (startMem) memory[k] = { start: startMem[1] }
    if (gotMemory && started) return resolve()
  })
}))).then(() => bench())

const urlTemplate = (port, string) => {
  const url = { host: 'localhost', port, path: `/bench/${benchId}` }
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
  const k = 1000
  const dm = 2
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

// benchamrks
const bencher = (title) => new Promise((resolve, reject) => {
  console.log(`benchmarking ${title}`)
  const port = ports[title]
  const done = (err, res) => {
    if (err) return reject(err)
    results.push(res)
    return resolve(title)
  }
  const acOpts = {
    url: urlTemplate(port, true),
    title,
    connections: lob ? 10 : 50,
    pipelining: lob ? 1 : 10,
    headers: { 'accept-encoding': 'gzip, deflate, br' }
  }
  autocannon(Object.assign({ duration: warmupSec }, acOpts), () => {
    autocannon(Object.assign({ duration: runSec }, acOpts), done)
  })
})

let last = {}
const checkConsistency = async (name) => {
  const port = ports[name]
  let { data, headers } = await get(urlTemplate(port, true))
  const isJSON = headers['content-type'].indexOf('application/json') !== -1
  data = `${JSON.stringify(data)}-isJson:${isJSON}`

  if (!data || (last.lib && last.result !== data)) {
    const err = new Error(`Got inconsistent results from libraries`)
    err.meta = [`${last.lib} - ${last.result}`, `${name} - ${data}`]
    throw err
  }
  last = { lib: name, result: data }
}

const getEndMemory = (name) => new Promise((resolve, reject) => {
  children[name].on('exit', () => resolve())
  children[name].send('endMemory')
})

async function bench () {
  console.log(`servers running, starting benchmarks\n`)
  const keys = shuffler(Object.keys(ports))

  for (const name of keys) {
    try {
      await checkConsistency(name)
    } catch (ex) {
      console.log(ex, name)
      process.exit()
    }
  }

  for (const name of keys) await bencher(name)
  for (const name of keys) await getEndMemory(name)

  const head = [
    { alias: 'lib', width: 12 },
    { alias: 'req/sec', width: 12 },
    { alias: 'latency', width: 12 },
    { alias: 'throughput', width: 14 },
    { alias: 'errors', width: 11 },
    { alias: 'memory (start)' },
    { alias: 'memory (end)' }
  ].map((h) => Object.assign({ paddingLeft: 0, paddingRight: 0 }, h))

  results.sort((a, b) => b.requests.average - a.requests.average)
  const rows = results.map((r) => [
    r.title,
    r.requests.average,
    r.latency.average,
    formatBytes(r.throughput.average),
    r.errors + r.non2xx,
    memory[r.title].start.split('/').map(formatBytes).join('\n'),
    memory[r.title].end.split('/').map(formatBytes).join('\n')
  ])

  const consoleOut = table(head, rows).render()
  console.log(consoleOut)

  const borderCharacters = [
    [
      { v: ' ', l: ' ', j: ' ', h: ' ', r: ' ' },
      { v: ' ', l: ' ', j: ' ', h: ' ', r: ' ' },
      { v: ' ', l: ' ', j: ' ', h: ' ', r: ' ' }
    ],
    [
      { v: '|', l: '.', j: '-', h: '-', r: '.' },
      { v: '|', l: '|', j: '|', h: '-', r: '|' },
      { v: '|', l: '*', j: '-', h: '-', r: '*' }
    ],
    [
      { v: '|', l: '+', j: '+', h: '-', r: '+' },
      { v: '|', l: '+', j: '+', h: '-', r: '+' },
      { v: '|', l: '+', j: '+', h: '-', r: '+' }
    ]
  ]
  const headerColor = null
  const fileOut = table(head, rows, { borderCharacters, headerColor }).render()
  writeFileSync('results.txt', fileOut, 'utf8')
  process.exit()
}
