'use strict'

const { base64 } = require('./lob.json')
const ports = {
  http: 3010,
  fastify: 3011,
  polka: 3012,
  scrud: 3013,
  express: 3014,
  hapi: 3015
}

const logStart = (n) => {
  process.send(n)
  let { heapUsed, heapTotal } = process.memoryUsage()
  process.send(`startMem${heapUsed}/${heapTotal}`)
}

process.on('message', (m) => {
  if (m === 'endMemory') {
    let { heapUsed, heapTotal } = process.memoryUsage()
    return process.send(`endMem${heapUsed}/${heapTotal}`)
  }
})

const toSend = process.argv[3] === 'lob' ? base64 : 301

const preRendered = JSON.stringify({ data: toSend, error: null })

const start = {}

start.http = () => {
  const http = require('http')
  http.createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(preRendered)
  }).listen(ports.http, () => logStart('http'))
}

start.fastify = () => {
  const fastify = require('fastify')()
  fastify.get('/bench/:id', function (req, reply) {
    reply.send({ data: toSend, error: null })
  })
  fastify.listen(ports.fastify, () => logStart('fastify'))
}

start.polka = () => {
  const polka = require('polka')
  polka().get('/bench/:id', (req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify({ data: toSend, error: null }))
  }).listen(ports.polka, () => logStart('polka'))
}

start.scrud = () => {
  const scrudOpts = { port: ports.scrud }
  const scrud = require('scrud')
  scrud.register('bench', { read: (req, res) => scrud.sendData(res, toSend) })
  scrud.start(scrudOpts).then(() => logStart('scrud'))
}

start.express = () => {
  const express = require('express')
  express().get('/bench/:id', (req, res) => {
    res.json({ data: toSend, error: null })
  }).listen(ports.express, () => logStart('express'))
}

start.hapi = () => {
  const { server: hapi } = require('hapi')
  const server = hapi({ host: 'localhost', port: ports.hapi })
  server.route({
    method: 'GET',
    path: '/bench/{id}',
    handler: (request, h) => { return { data: toSend, error: null } }
  })
  server.start().then(() => logStart('hapi'))
}

start[process.argv[2]]()
