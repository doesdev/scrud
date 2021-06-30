'use strict'

const { Client } = require('pg')
const { setupDatabase } = require('./_schema')
const password = process.env.TEST_USER_PASSWORD || 'insecure_password'
const pgConfig = { database: 'scrud_test', user: 'scrud_user', password }

const dropDb = 'DROP DATABASE scrud_test;'
const createDb = 'CREATE DATABASE scrud_test;'
const dropUser = 'DROP USER scrud_user;'
const grantAccess = 'GRANT ALL PRIVILEGES ON DATABASE scrud_test TO scrud_user;'
const createUser = (p) => `CREATE USER scrud_user WITH ENCRYPTED PASSWORD ${p};`

const setup = async () => {
  const client = new Client()
  await client.connect()

  try {
    await client.query(dropDb)
  } catch (ex) {}

  try {
    await client.query(dropUser)
  } catch (ex) {}

  try {
    await client.query(createDb)
  } catch (ex) {}

  try {
    await client.query(createUser(client.escapeLiteral(password)))
  } catch (ex) {}

  try {
    await client.query(grantAccess)
  } catch (ex) {}

  try {
    await setupDatabase(pgConfig)
  } catch (ex) {
    console.error(ex)
    throw new Error('Database setup failed')
  }

  await client.end()
}

const teardown = async () => {
  const client = new Client()
  await client.connect()

  try {
    await client.query(dropDb)
  } catch (ex) {}

  try {
    await client.query(dropUser)
  } catch (ex) {}

  await client.end()
}

module.exports = { setup, teardown, pgConfig }
