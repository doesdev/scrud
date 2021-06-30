### Contributing code
- fork
- create (feature / fix) branch in your fork
- add tests
- use `js standard` code style
- open pull request

### Tests
Tests require a running instance of Postgres and environment variables setup in
accordance with the [pg docs](https://node-postgres.com/features/connecting#environment-variables).

A new database (`scrud_test`) and user (`scrud_user`) will be created on that
PG instance, then dropped when tests have completed.
