# scrud [![NPM version](https://badge.fury.io/js/scrud.svg)](https://npmjs.org/package/scrud)   [![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](https://github.com/feross/standard)   [![Dependency Status](https://dependencyci.com/github/doesdev/scrud/badge)](https://dependencyci.com/github/doesdev/scrud)

> Super opinionated, minimalistic, PG centric API fabric

# what it is

- a collection of helpers that allow you to stand up APIs rapidly
- extremely opinionated
- driven by PostgreSQL functions
- all APIs revolve around [SCRUD](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete) actions
- all resource actions have default handlers but can be individually overridden

# who is it for

- me mostly
- organizations / individuals comfortable working with business logic in Postgres

# install

```sh
$ npm install --save scrud
```

# api

### scrud.register(name, options)
- Registers a resource as an API, enabling it to respond to SCRUD actions against it
- A common pattern would be registering resources that correlate to database tables
- Does not have to correlate to a database table
- If actions are not being overridden requires matching PG functions for each action
- Each PG function matches pattern `${namespace}_${resource}_${action}(IN jsonb, OUT jsonb)`
- PG functions receive `JSONB` object containing the following
  - `auth` - auth object (i.e. JWT payload)
  - `ip` - client IP address
  - `id` - resource id for `READ`, `UPDATE`, `DELETE`
  - `id_array` - array of single resource id for `READ`
  - anything passed as querystring or in JSON body will be passed along and should be validated / escaped within PG functions
- PG functions are expected to reply with an array of record in `JSONB` format
- All PG functions should reply with array, even if they act on single resource

***Returns:*** Promise which with resolves with resource object

***Arguments:***
- **name** *(String)* - *required*
- **options** *(Object)* - *optional*
  - **search** - *optional*
    - type: `Function` - receives (http.ClientRequest, http.ServerResponse)
    - default: calls `${namespace}_${resource}_search(IN jsonb, OUT jsonb)` PG function and responds to client with array of records or error
  - **create** - *optional*
    - type: `Function` - receives (http.ClientRequest, http.ServerResponse)
    - default: calls `${namespace}_${resource}_create(IN jsonb, OUT jsonb)` PG function and responds to client with created record or error
  - **read** - *optional*
    - type: `Function` - receives (http.ClientRequest, http.ServerResponse)
    - default: calls `${namespace}_${resource}_read(IN jsonb, OUT jsonb)` PG function and responds to client with record or error
  - **update** - *optional*
    - type: `Function` - receives (http.ClientRequest, http.ServerResponse)
    - default: calls `${namespace}_${resource}_update(IN jsonb, OUT jsonb)` PG function and responds to client with updated record or error
  - **delete** - *optional*
    - type: `Function` - receives (http.ClientRequest, http.ServerResponse)
    - default: calls `${namespace}_${resource}_delete(IN jsonb, OUT jsonb)` PG function and responds to client with data (success) or error

### scrud.start(options)
Set global options and start API server

***Returns:*** Promise which with resolves with http.Server

***Arguments:***
- **options** *(Object)* - *required*
  - **basePath** - *optional* - base path for APIs (i.e. `https://host.com/${basePath}/resource`)
    - type: `String`
    - default: `null`
  - **namespace** - *optional* - namespace to use in PG function calls (i.e. `${namespace}_${resource}_${action}`). If not set the PG function called will be `${resource}_${action}`
    - type: `String`
    - default: `null`
  - **postgres** - *required if using DB backed actions* - configuration for [node-postgres](https://github.com/brianc/node-postgres) connection
    - type: `Object` matching config specs for [node-postgres](https://github.com/brianc/node-postgres)
    - default: `null`
  - **jsonwebtoken** - *required for JWT authentication* - configuration for [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) connection
    - type: `Object` that contains options from both the `sign` and `verify` methods at [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken)
    - default: `null`
  - **maxBodyBytes** - *optional* - max bytes allowed from incoming request body
    - type: `Integer` (bytes)
    - default: `1e6`
  - **logger** - *optional* - callback that will get called with any errors encountered
    - type: `Function` - receives (Error, String[loglevel])
    - default: `console.log`
  - **authTrans** - *optional* - Synchronous function that transforms the passed in auth object before proceeding with processing
    - type: `Function` - receives (Object[auth / JWT payload)])
    - default: `1e6`
    - returns: `Object` - updated auth object

# helper functions  
- sendData(res, data) - send response data to client
- sendErr(res, error, code) - send error to client  
- logIt(error, logLevel) - invoke logger with error and logLevel  
- fourOhOne(res, err) - send 401 (unauthorized) error to client  
- fourOhFour(res, err) - send 404 (not found) error to client  
- genToken(payload) - generate JWT token  
- authenticate(jwt) - authenticate JWT token  
- find(resource, id, params) - call PG read function for resource  
- findAll(resource, params) - call PG search function for resource  
- create(resource, params) - call PG create function for resource  
- save(resource, id, params) - call PG update function for resource  
- destroy(resource, id, params) - call PG delete function for resource  

# usage

```js
const scrud = require('scrud')
const config = require('./secrets.json')

async function main () {
  await scrud.register('member')
  await scrud.start(config)
}
```

# license

MIT © [Andrew Carpenter](https://github.com/doesdev)
