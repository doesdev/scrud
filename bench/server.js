'use strict'

const { base64 } = require('./lob.json')
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
const toSend = process.argv[3] === 'lob' ? base64 : 301
const preRendered = JSON.stringify({data: toSend, error: null})
const start = {
  http: () => {
    const http = require('http')
    http.createServer((req, res) => {
      res.setHeader('Content-Type', 'application/json')
      res.end(preRendered)
    }).listen(ports.http, () => logStart('http'))
  },
  fastify: () => {
    const fastify = require('fastify')()
    fastify.get('/bench/:id', function (req, reply) {
      reply.send({data: toSend, error: null})
    })
    fastify.listen(ports.fastify, () => logStart('fastify'))
  },
  polka: () => {
    const polka = require('polka')
    polka().get('/bench/:id', (req, res) => {
      res.end(JSON.stringify({data: toSend, error: null}))
    }).listen(ports.polka).then(() => logStart('polka'))
  },
  scrud: () => {
    const scrud = require('./../index')
    scrud.register('bench', {read: (req, res) => scrud.sendData(res, toSend)})
    scrud.start({port: ports.scrud}).then(() => logStart('scrud'))
  },
  express: () => {
    const express = require('express')
    express().get('/bench/:id', (req, res) => {
      res.json({data: toSend, error: null})
    }).listen(ports.express, () => logStart('express'))
  }
}

start[process.argv[2]]()
