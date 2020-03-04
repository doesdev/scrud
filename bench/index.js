'use strict'

const http = require('http')
const { fork } = require('child_process')
const { join } = require('path')
const { writeFileSync } = require('fs')
const axios = require('axios')
const autocannon = require('autocannon')
const table = require('tty-table')
const { user } = require('./data.json')
const writeToFile = process.argv.some((a) => a === '--render')
const post = process.argv.some((a) => a === '--post')
const lob = !post && process.argv.some((a) => a === '--lob')
const warmupSec = 3
const runSec = 7
const { ports } = require('./server')
const results = []
const benchId = 301
const children = {}
const memory = {}

Promise.all(Object.keys(ports).map((k) => new Promise((resolve, reject) => {
  const childArgv = [k, lob, post]
  const child = children[k] = fork(join(__dirname, 'server'), childArgv)
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
  const path = post ? '/user' : `/user/${benchId}`
  const url = { host: 'localhost', port, path }
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
  const method = post ? 'POST' : 'GET'
  const url = urlTemplate(port, true)
  const body = post ? JSON.stringify({ user }) : undefined
  const done = (err, res) => {
    if (err) return reject(err)
    results.push(res)
    return resolve(title)
  }

  const req = http.request(url, { method }, (res) => {
    let expectBody = ''
    res.setEncoding('utf8')
    res.on('data', (chunk) => {
      expectBody += chunk
    })

    res.on('end', () => {
      const acOpts = {
        title,
        url,
        method,
        body,
        connections: lob || post ? 10 : 50,
        pipelining: lob || post ? 1 : 10,
        expectBody
      }

      autocannon(Object.assign({ duration: warmupSec }, acOpts), () => {
        autocannon(Object.assign({ duration: runSec }, acOpts), done)
      })
    })
  })

  req.on('error', reject)
  if (body) req.write(body)
  req.end()
})

let last = {}
const checkConsistency = async (name) => {
  const port = ports[name]
  const clientOpts = {
    url: urlTemplate(port, true),
    method: post ? 'POST' : 'GET',
    data: post ? { user } : undefined
  }
  const { data: rawData, headers } = await axios(clientOpts)
  const isJSON = headers['content-type'].indexOf('application/json') !== -1
  const data = `${JSON.stringify(rawData)}-isJson:${isJSON}`

  if (!data || (last.lib && last.result !== data)) {
    const err = new Error('Got inconsistent results from libraries')
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
  console.log('servers running, starting benchmarks\n')
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
    { alias: 'errors', width: 11 }
  ].map((h) => Object.assign({ paddingLeft: 0, paddingRight: 0 }, h))

  results.sort((a, b) => b.requests.average - a.requests.average)
  const rows = results.map((r) => [
    r.title,
    r.requests.average,
    r.latency.average,
    formatBytes(r.throughput.average),
    r.errors + r.non2xx + r.mismatches
  ])

  const consoleOut = table(head, rows).render()
  console.log(consoleOut)
  if (!writeToFile) return process.exit()

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
  const name = post ? 'create' : (lob ? 'lob' : 'read')
  writeFileSync(`results/${name}.txt`, fileOut, 'utf8')
  process.exit()
}
