'use strict'

const http = require('http')
const getScrud = require('get-scrud')
const polka = require('polka')
const fastify = require('fastify')()
const scrud = require('./../index')
const express = require('express')
const autocannon = require('autocannon')
const table = require('tty-table')
const ports = {http: 3010, fastify: 3011, polka: 3012, scrud: 3013, express: 3014}
const ready = {}
Object.keys(ports).forEach((k) => { ready[k] = false })
const logStart = (n) => {
  ready[n] = true
  if (Object.keys(ready).every((k) => ready[k])) bench()
}
const results = []

const urlTemplate = (port) => `http://localhost:${port}/hello`

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

// HTTP
http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify({data: 'world', error: null}))
}).listen(ports.http, () => logStart('http'))

// FASTIFY
fastify.get('/hello', function (req, reply) {
  reply.send({data: 'world', error: null})
})
fastify.listen(ports.fastify, () => logStart('fastify'))

// POLKA
polka().get('/hello', (req, res) => {
  res.end(JSON.stringify({data: 'world', error: null}))
}).listen(ports.polka).then(() => logStart('polka'))

// SCRUD
scrud.register('hello', {search: (req, res) => scrud.sendData(res, 'world')})
scrud.start({port: ports.scrud}).then(() => logStart('scrud'))

// EXPRESS
express().get('/hello', (req, res) => {
  res.end(JSON.stringify({data: 'world', error: null}))
}).listen(ports.express, () => logStart('express'))

// benchamrks
const bencher = (title) => new Promise((resolve, reject) => {
  console.log(`benchmarking ${title}`)
  let port = ports[title]
  let done = (err, res) => {
    if (err) return reject(err)
    results.push(res)
    return resolve(title)
  }
  let acOpts = {url: urlTemplate(port), title, connections: 50}
  autocannon(Object.assign({duration: 3}, acOpts), () => {
    autocannon(Object.assign({duration: 7}, acOpts), done)
  })
})

let lastResult
const checkConsistency = async (name) => {
  let port = ports[name]
  let { search } = getScrud({host: 'localhost', port})
  let tmpRes = await search('hello', {})
  if (!tmpRes || (lastResult && lastResult !== tmpRes)) {
    throw new Error(`Got inconsistent results from libraries`)
  }
  lastResult = tmpRes
}

async function bench () {
  console.log(`servers running, starting benchmarks\n`)
  let keys = shuffler(Object.keys(ports))
  for (let name of keys) {
    try {
      await checkConsistency(name)
    } catch (ex) {
      console.log(ex)
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
