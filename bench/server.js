'use strict'

const ports = {http: 3010, fastify: 3011, polka: 3012, scrud: 3013, express: 3014}
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
const benchId = 301
const start = {
  http: () => {
    const http = require('http')
    http.createServer((req, res) => {
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({data: `${benchId}`, error: null}))
    }).listen(ports.http, () => logStart('http'))
  },
  fastify: () => {
    const fastify = require('fastify')()
    fastify.get('/bench/:id', function (req, reply) {
      reply.send({data: `${req.params.id}`, error: null})
    })
    fastify.listen(ports.fastify, () => logStart('fastify'))
  },
  polka: () => {
    const polka = require('polka')
    polka().get('/bench/:id', (req, res) => {
      res.end(JSON.stringify({data: `${req.params.id}`, error: null}))
    }).listen(ports.polka).then(() => logStart('polka'))
  },
  scrud: () => {
    const scrud = require('./../index')
    scrud.register('bench', {read: (req, res) => scrud.sendData(res, `${req.id}`)})
    scrud.start({port: ports.scrud}).then(() => logStart('scrud'))
  },
  express: () => {
    const express = require('express')
    express().get('/bench/:id', (req, res) => {
      res.end(JSON.stringify({data: `${req.params.id}`, error: null}))
    }).listen(ports.express, () => logStart('express'))
  }
}

start[process.argv[2]]()
