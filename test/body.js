import test from 'mvt'
import http from 'node:http'
import { start, shutdown, sendData } from '../index.js'

const PORT = 8093
const MAX = 1000
const ACCENTED = 'Chloé Zoë Ünïcøde'

let seen = null

const echo = (req, res) => {
  seen = req.params

  return sendData(res, req.params)
}

// no postgres and no jsonwebtoken, so the body path is all that is exercised
const opts = {
  port: PORT,
  base: '/api',
  logger: () => {},
  maxBodyBytes: MAX,
  requestTimeout: 90000,
  registerAPIs: [{ name: 'thing', handlers: { create: echo } }]
}

let server

test.before(async () => { server = await start(opts) })

test.after(() => shutdown())

// writes the body in caller supplied pieces so chunk boundaries are ours
const post = (chunks, headers = {}) => new Promise((resolve, reject) => {
  const pieces = Array.isArray(chunks) ? chunks : [Buffer.from(chunks)]
  const req = http.request({
    port: PORT,
    path: '/api/thing',
    method: 'POST',
    headers: Object.assign({ 'content-type': 'application/json' }, headers)
  }, (res) => {
    let out = ''

    res.on('data', (d) => { out += d })
    res.on('end', () => resolve({ statusCode: res.statusCode, body: out }))
  })

  req.on('error', reject)
  pieces.forEach((piece) => req.write(piece))
  req.end()
})

// declares a large body then sends only a sliver of it and never ends, so
// the only way a response arrives is if the server refused it up front
const postPartial = (declared, headers = {}) => new Promise((resolve) => {
  const req = http.request({
    port: PORT,
    path: '/api/thing',
    method: 'POST',
    headers: Object.assign({
      'content-type': 'application/json',
      'content-length': String(declared)
    }, headers)
  }, (res) => {
    res.resume()
    resolve({ statusCode: res.statusCode })
  })

  req.on('error', () => resolve({ statusCode: null }))
  req.write('{"pad":"xxxx')

  setTimeout(() => resolve({ statusCode: null, timedOut: true }), 2000)
})

const jsonOf = (bytes, key = 'pad') => {
  const filler = 'x'.repeat(Math.max(0, bytes - key.length - 9))

  return `{"${key}":"${filler}"}`
}

test('a body under the limit round trips', async (assert) => {
  const { statusCode, body } = await post(jsonOf(200))

  assert.is(statusCode, 200)
  assert.true(JSON.parse(body).data.pad.length > 100)
})

test('an oversized content-length is refused before the body', async (assert) => {
  seen = null

  const big = jsonOf(MAX * 4)
  const { statusCode, body } = await post(big)

  assert.is(statusCode, 413)
  assert.is(JSON.parse(body).error, 'Body too large')
  // the point of the early check, the handler never saw the request
  assert.is(seen, null)
})

test('an oversized body is refused before it is sent', async (assert) => {
  seen = null

  const { statusCode, timedOut } = await postPartial(MAX * 4)

  assert.false(Boolean(timedOut))
  assert.is(statusCode, 413)
  assert.is(seen, null)
})

test('an oversized streamed body is refused', async (assert) => {
  seen = null

  const chunk = Buffer.from('x'.repeat(400))
  const chunks = [Buffer.from('{"pad":"'), chunk, chunk, chunk, chunk]
  const headers = { 'transfer-encoding': 'chunked' }
  const { statusCode } = await post(chunks, headers)

  assert.is(statusCode, 413)
  assert.is(seen, null)
})

test('the limit counts bytes, not utf16 code units', async (assert) => {
  // every char here is 2 bytes, so this is under the limit by string length
  // and over it by byte length, which is what maxBodyBytes documents
  const pad = 'é'.repeat(Math.floor(MAX * 0.75))
  const body = Buffer.from(`{"pad":"${pad}"}`, 'utf8')

  assert.true(`{"pad":"${pad}"}`.length < MAX)
  assert.true(body.length > MAX)

  const { statusCode } = await post([body])

  assert.is(statusCode, 413)
})

test('a multibyte character split across chunks survives', async (assert) => {
  const body = Buffer.from(JSON.stringify({ name: ACCENTED }), 'utf8')
  const at = body.indexOf(Buffer.from('é', 'utf8')) + 1
  const chunks = [body.subarray(0, at), body.subarray(at)]

  // only meaningful if the split really is inside the character
  const naive = chunks[0].toString('utf8') + chunks[1].toString('utf8')
  assert.not(naive, body.toString('utf8'))

  const { statusCode, body: out } = await post(chunks)

  assert.is(statusCode, 200)
  assert.is(JSON.parse(out).data.name, ACCENTED)
})

test('requestTimeout is applied to the server', async (assert) => {
  assert.is(server.requestTimeout, 90000)
})

test('an empty body is still an empty object', async (assert) => {
  const { statusCode, body } = await post([])

  assert.is(statusCode, 200)
  assert.is(JSON.parse(body).error, null)
})
