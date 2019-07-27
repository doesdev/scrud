'use strict'

const { base64 } = require('./data.json')
const [framework, lobFlag, postFlag] = process.argv.slice(2)
const lob = lobFlag && lobFlag !== 'false'
const post = postFlag && postFlag !== 'false'
const start = {}
const toSend = lob ? base64 : 301
const ports = {
  http: 3010,
  fastify: 3011,
  polka: 3012,
  scrud: 3013,
  'scrud + turbo': 3014,
  express: 3015,
  hapi: 3016
}

const logStart = (n) => {
  process.send(n)
  const { heapUsed, heapTotal } = process.memoryUsage()
  process.send(`startMem${heapUsed}/${heapTotal}`)
}

process.on('message', (m) => {
  if (m === 'endMemory') {
    const { heapUsed, heapTotal } = process.memoryUsage()
    return process.send(`endMem${heapUsed}/${heapTotal}`)
  }
})

start.http = () => {
  const http = require('http')
  http.createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    if (!post) return res.end(JSON.stringify({ data: toSend, error: null }))
    let body = ''
    req.on('data', (chunk) => { body += chunk })
    req.on('end', () => {
      const b64 = JSON.parse(body).user
      return res.end(JSON.stringify({ data: b64, error: null }))
    })
  }).listen(ports.http, () => logStart('http'))
}

start.fastify = () => {
  const fastify = require('fastify')()
  fastify.get('/user/:id', function (req, reply) {
    reply.send({ data: toSend, error: null })
  })
  if (post) {
    fastify.post('/user', function (req, reply) {
      reply.send({ data: req.body.user, error: null })
    })
  }
  fastify.listen(ports.fastify, () => logStart('fastify'))
}

start.polka = () => {
  const polka = require('polka')()
  polka.get('/user/:id', (req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify({ data: toSend, error: null }))
  })
  if (post) {
    polka.use(require('body-parser').json())
    polka.post('/user', (req, res) => {
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(JSON.stringify({ data: req.body.user, error: null }))
    })
  }
  polka.listen(ports.polka, () => logStart('polka'))
}

start.scrud = () => {
  const scrudOpts = { port: ports.scrud, turbo: false }
  const scrud = require('scrud')
  scrud.register('user', {
    create: (req, res) => scrud.sendData(res, req.params.user),
    read: (req, res) => scrud.sendData(res, toSend)
  })
  scrud.start(scrudOpts).then(() => logStart('scrud'))
}

start['scrud + turbo'] = () => {
  const scrudOpts = { port: ports['scrud + turbo'], turbo: true }
  const scrud = require('scrud')
  scrud.register('user', {
    create: (req, res) => scrud.sendData(res, req.params.user),
    read: (req, res) => scrud.sendData(res, toSend)
  })
  scrud.start(scrudOpts).then(() => logStart('scrud + turbo'))
}

start.express = () => {
  const express = require('express')()
  express.get('/user/:id', (req, res) => {
    res.json({ data: toSend, error: null })
  })
  if (post) {
    express.use(require('body-parser').json())
    express.post('/user', (req, res) => {
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(JSON.stringify({ data: req.body.user, error: null }))
    })
  }
  express.listen(ports.express, () => logStart('express'))
}

start.hapi = () => {
  const { server: hapi } = require('hapi')
  const server = hapi({ host: 'localhost', port: ports.hapi })
  server.route({
    method: 'GET',
    path: '/user/{id}',
    handler: (req, h) => { return { data: toSend, error: null } }
  })
  if (post) {
    server.route({
      method: 'POST',
      path: '/user',
      handler: (req, h) => { return { data: req.payload.user, error: null } }
    })
  }
  server.start().then(() => logStart('hapi'))
}

if (typeof start[framework] === 'function') start[framework]()

module.exports = { ports }
