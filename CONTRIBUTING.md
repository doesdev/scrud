### Contributing code
- fork
- create (feature / fix) branch in your fork
- add tests
- use `js standard` code style
- open pull request

### Tests
`yarn test` runs the tests in `test/`, which need nothing but node.

The tests in `test-db/` need a database and are opt in, run them with
`yarn test-db`, or run everything with `yarn test-all`.

They require a running instance of Postgres and environment variables setup in
accordance with the [pg docs](https://node-postgres.com/features/connecting#environment-variables).

A new database (`scrud_test`) and user (`scrud_user`) will be created on that
PG instance, then dropped when tests have completed.
