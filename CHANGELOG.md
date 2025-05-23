### Changelog

All notable changes to this project will be documented in this file. Dates are displayed in UTC.

### [10.1.0](https://github.com/doesdev/scrud/compare/10.0.0...10.1.0)

> 23 May 2025

#### Dependencies
- update `pg` from 8.13.1 to 8.16.0 (use names ESM import for `Pool`)

### [10.0.0](https://github.com/doesdev/scrud/compare/9.0.0...10.0.0)

> 11 December 2024

#### General
- Change from CommonJS to ES Module

#### Dependencies
- update `pg` from 8.11.1 to 8.13.1
- update `jsonwebtoken`  from 9.0.1 to 9.0.2

### [9.0.0](https://github.com/doesdev/scrud/compare/8.0.0...9.0.0)

> 26 July 2023

#### General
- Add SEARCH via POST (indicated by POST where path ends with ?)

#### Dependencies
- update `pg` from 8.10.0 to 8.11.1
- update `jsonwebtoken`  from 9.0.0 to 9.0.1

### [8.0.0](https://github.com/doesdev/scrud/compare/7.4.1...8.0.0)

> 1 May 2023

#### General
- Remove gimicky crap
- Deprecate turbo option
- Switch to Yarn

#### Dependencies
- update `pg` from 8.7.3 to 8.10.0
- update `jsonwebtoken`  from 8.5.1 to 9.0.0
- remove `quick-lru`
- update dev deps

### [7.4.1](https://github.com/doesdev/scrud/compare/7.4.0...7.4.1)

> 7 April 2022

#### Dependencies
- update `pg` to 8.7.3

### [7.4.0](https://github.com/doesdev/scrud/compare/7.3.0...7.4.0)

> 17 January 2022

#### Features
- add ability to specify PG connection per resource

#### Dependencies
- update `pg` to 8.7.1
- update several dev deps

### [7.3.0](https://github.com/doesdev/scrud/compare/7.2.1...7.3.0)

> 22 September 2021

#### Fixes
- fix `Cannot convert undefined or null to object` bug

#### Dependencies
- update `pg` to 8.7.1
- update several dev deps

### [7.2.1](https://github.com/doesdev/scrud/compare/7.2.0...7.2.1)

> 30 June 2021

#### Fixes
- fix bug that would exclude action custom handlers from `onError` catching them

### [7.2.0](https://github.com/doesdev/scrud/compare/7.1.0...7.2.0)

> 30 June 2021

#### Dependencies
- update `pg` to 8.6.0

#### Docs
- add `CONTRIBUTING.md`

#### Tests
- handle DB setup and teardown within the tests

### [7.1.0](https://github.com/doesdev/scrud/compare/7.0.4...7.1.0)

> 15 November 2020

#### Features
- add `useNotModified` option, hash the response and return 304 if matched

#### Dependencies
- update `pg` to 8.5.1

#### Docs
- document new `useNotModified` option
- fix description of `registerAPIs` option

### [7.0.4](https://github.com/doesdev/scrud/compare/7.0.3...7.0.4)

> 5 November 2020

#### Dependencies
- update `pg` to 8.4.2

### [7.0.3](https://github.com/doesdev/scrud/compare/7.0.2...7.0.3)

> 30 September 2020

#### Dependencies
- update `pg` 8.3.3
- update `quick-lru` to 5.1.1

### [7.0.2](https://github.com/doesdev/scrud/compare/7.0.1...7.0.2)

> 26 May 2020

#### Dependencies
- Update `pg` to version 8.2.0 (performance improvements)

### [7.0.1](https://github.com/doesdev/scrud/compare/7.0.0...7.0.1)

> 8 May 2020

#### Dependencies
- Update `pg` to version 8.1.0

### [7.0.0](https://github.com/doesdev/scrud/compare/6.0.7...7.0.0)

> 27 April 2020

#### Dependencies
- Update `pg` to version 8 ([breaking](https://github.com/brianc/node-postgres/blob/master/CHANGELOG.md#pg800))
- Update `quick-lru`
- Update `husky` (dev dep)

#### General
- requires Node version 8 or higher (in accordance with `pg`)
- Remove never realized `realtime` module

#### Benchmarks
- Update `fastify`
- Update bench results

### [6.0.7](https://github.com/doesdev/scrud/compare/6.0.6...6.0.7)

> 3 March 2020

#### Dependencies
- Update pg
- Update quick-lru
- Update dev deps

#### Benchmarks
- Use expectBody and mark mismatches as errors
- Update hapi, fastify, autocannon
- Roll back tty-table because I'm too lazy to try and update it
- Update bench results

### [6.0.6](https://github.com/doesdev/scrud/compare/6.0.5...6.0.6)

> 8 January 2020

- Update pg, a couple dev deps (again)

### [6.0.5](https://github.com/doesdev/scrud/compare/6.0.4...6.0.5)

> 20 November 2019

- Update pg, a couple dev deps

### [6.0.4](https://github.com/doesdev/scrud/compare/6.0.3...6.0.4)

> 26 August 2019

- Update dependencies
- Fix some standard style issues

### [6.0.3](https://github.com/doesdev/scrud/compare/6.0.0...6.0.3)

> 26 July 2019

- Add `shutdown` helper
- Use MVT instead of AVA for tests
- Update dependencies
- Fix some standard style issues
- Update benchmarks

### [6.0.0](https://github.com/doesdev/scrud/compare/5.0.0...6.0.0)

> 13 March 2019

Updated `tiny-params` will now convert `'null'` and `'undefined'` to
`null`. This could have significant impact on PG functions expecting
a string. As such tis a semver major bump. bump. bumpity bump.

### [5.0.0](https://github.com/doesdev/scrud/compare/4.3.3...5.0.0)

> 12 March 2019

Breaking changes:
- Make `register` function synchronous

Additions:
- Added `onError` option to resource handlers
- Added `registerAPIs` to start
- Added tests for `beforeQuery`, `beforeSend`, and `onError`

- Add onError, registerAPIs, make register sync [`5729e93`](https://github.com/doesdev/scrud/commit/5729e935b3cf734351ea47b29f1e998b6f9dd65b)

#### [4.3.3](https://github.com/doesdev/scrud/compare/4.3.2...4.3.3)

> 12 March 2019

- Update tiny-params [`0d82fd0`](https://github.com/doesdev/scrud/commit/0d82fd042d8207778502eedb1492a927d1780e1e)

#### [4.3.2](https://github.com/doesdev/scrud/compare/4.3.1...4.3.2)

> 12 March 2019

- Update deps [`2de8ac2`](https://github.com/doesdev/scrud/commit/2de8ac27cbae79a31bb55fd01d05774e7077191d)
- Bump to 4.3.2 [`70a1579`](https://github.com/doesdev/scrud/commit/70a157975049ef0143c8fa289e99ab56ff881620)

#### [4.3.1](https://github.com/doesdev/scrud/compare/4.3.0...4.3.1)

> 10 March 2019

- Feature/turbo [`#17`](https://github.com/doesdev/scrud/pull/17)
- Update benchmarks [`89b6348`](https://github.com/doesdev/scrud/commit/89b634859f388d330da63116ad6038f2e6d4d7dd)
- Bump version [`a594318`](https://github.com/doesdev/scrud/commit/a594318afecde47777ea5f5c2dc276e255fa6daa)
- Update deps [`da50dc9`](https://github.com/doesdev/scrud/commit/da50dc93440171c43573fa2829967130c6ef3bc4)
- Update deps [`9c12ffa`](https://github.com/doesdev/scrud/commit/9c12ffae45203e1f185421ded3682dd14f0376a6)
- Update changelog [`e5d2f7f`](https://github.com/doesdev/scrud/commit/e5d2f7f3025675d4e6a60ee4a0bc03fe811662e3)
- Create CNAME [`2f55bc9`](https://github.com/doesdev/scrud/commit/2f55bc935664ab42216f5628094d97db7abcc19a)
- Set theme jekyll-theme-cayman [`3505382`](https://github.com/doesdev/scrud/commit/3505382482f62baa2c34970930e9bcd2c326dfd4)

#### [4.3.0](https://github.com/doesdev/scrud/compare/4.2.8...4.3.0)

> 18 December 2018

- Feature/turbo [`#16`](https://github.com/doesdev/scrud/pull/16)
- Update dev-deps, use const where we can, fix #15 [`#15`](https://github.com/doesdev/scrud/issues/15)
- Start on turbo tests, it ain't working [`6447138`](https://github.com/doesdev/scrud/commit/64471388aab455e0c262517127c8fc3a087a266e)
- Tests working for non-turbo and turbo [`f916e6f`](https://github.com/doesdev/scrud/commit/f916e6f36663dd1c14fa2c537ed11d4b0567c76e)
- Update bench, version 4.3.0 [`26b8baa`](https://github.com/doesdev/scrud/commit/26b8baa08944663fe3a05d6ec6512afc2f237221)
- Get turbo as peer-dep actually working [`09eaf4f`](https://github.com/doesdev/scrud/commit/09eaf4f23d5abe4583b3ff6fe5fc06c16dd8de24)
- Update benches [`932347e`](https://github.com/doesdev/scrud/commit/932347e5df4b24d10a961653dfe643460dacfce4)
- Update CHANGELOG [`754fb5f`](https://github.com/doesdev/scrud/commit/754fb5fc758639432561601a354ccf12746dace6)
- Add bench for scrud + turbo [`4bd8e70`](https://github.com/doesdev/scrud/commit/4bd8e70c2e10484232ffdbc35777f6b91d3531c6)
- Update readme, default turbo to false [`1b905bd`](https://github.com/doesdev/scrud/commit/1b905bdeec2de04d30e669b0f68841509e36110f)
- Update readme [`7903362`](https://github.com/doesdev/scrud/commit/7903362e589653886be74173e8b0379ce67c015a)

#### [4.2.8](https://github.com/doesdev/scrud/compare/4.2.7...4.2.8)

> 12 December 2018

- Make it easier to update benchmark results [`e7fb39b`](https://github.com/doesdev/scrud/commit/e7fb39b02798d6344709d308356e6c5eb3205584)
- Update deps of submodules [`e0d130c`](https://github.com/doesdev/scrud/commit/e0d130cdbca8fd1a570b40d4c98ccecfe86fd553)
- Add Create/POST benchmark, add bench readme [`1b75b52`](https://github.com/doesdev/scrud/commit/1b75b52d47176ed5f5e4bc44316c1757409b4784)
- Make bench code slightly less ugly [`08233d5`](https://github.com/doesdev/scrud/commit/08233d55677d3f03428e9fc83939af73c4da8f36)
- Use quick-lru for url parsing cache [`77eb15d`](https://github.com/doesdev/scrud/commit/77eb15d0f268ef52b9beda90d20b675aad4070ea)
- Update changelog [`e522b29`](https://github.com/doesdev/scrud/commit/e522b293cdd8a48fc28ebdc04af30d1b8cd9cddd)
- Add notes about intent in benchmark readme [`4a6ebb1`](https://github.com/doesdev/scrud/commit/4a6ebb1fb5ab673963c5e5a3a0af04402ddf0a50)
- Tweak bench table formatting [`588e568`](https://github.com/doesdev/scrud/commit/588e56899fff11961443947de8ca904667042f25)
- Remove crappy send cache, no gzip on lob bench [`66fe753`](https://github.com/doesdev/scrud/commit/66fe753c2bb77010b92349f95ac518bb36b45825)
- Set benchmark run times back to what they were [`9105b17`](https://github.com/doesdev/scrud/commit/9105b177ab3d529e1388eb097b03c67bc002c06c)
- Remove bench modifiers pending randomized bench [`0b202b6`](https://github.com/doesdev/scrud/commit/0b202b6c67756a4b6bf515074b90c65e9288afa2)
- Allow overriding JWT opts in helper functions [`fa557a9`](https://github.com/doesdev/scrud/commit/fa557a9dd05af8d817b15ad8aab38b1b3f00f572)
- Less hyperbole [`d6788c9`](https://github.com/doesdev/scrud/commit/d6788c9869b94aac85c3b12b20cd566baf0c4de3)

#### [4.2.7](https://github.com/doesdev/scrud/compare/4.2.6...4.2.7)

> 6 December 2018

- Update dependencies, bump to 4.2.7 [`1f4ab2d`](https://github.com/doesdev/scrud/commit/1f4ab2d08716ddbe56ab7f0f2a1f2df02dfcc472)
- Update changelog [`1d71c1a`](https://github.com/doesdev/scrud/commit/1d71c1a015952fc33ed6344094ca9adb9caab775)

#### [4.2.6](https://github.com/doesdev/scrud/compare/4.2.5...4.2.6)

> 9 October 2018

- Update PG again, use client.release over client.end [`3cb8d46`](https://github.com/doesdev/scrud/commit/3cb8d469627725aca7b279c50f612a23f1f9b35c)
- Bump to 4.2.6 [`f330907`](https://github.com/doesdev/scrud/commit/f3309075e9f7b4dbb12b12c1ea48f77c7d98f5cd)
- Ensure release isn't called more than once [`d87c2ed`](https://github.com/doesdev/scrud/commit/d87c2ed655649069aebbc40de91f21177a51a0b4)
- Use local released flag [`77d33f3`](https://github.com/doesdev/scrud/commit/77d33f3e741c92162d95c700b6cee1ade48d5a31)

#### [4.2.5](https://github.com/doesdev/scrud/compare/4.2.4...4.2.5)

> 8 October 2018

- Update changelog [`f250821`](https://github.com/doesdev/scrud/commit/f250821a37511ded6a8e14bc13137ec5854ea8a8)
- Roll back pg to 7.4.3 [`c7f0977`](https://github.com/doesdev/scrud/commit/c7f0977678e055f9da34c37205197ff13e7354f6)

#### [4.2.4](https://github.com/doesdev/scrud/compare/4.2.3...4.2.4)

> 8 October 2018

- Update pg dep to 7.5.0 [`85d634e`](https://github.com/doesdev/scrud/commit/85d634e642b641fc7891fe49b0228abffaf490e6)
- Update changelog [`c9afc51`](https://github.com/doesdev/scrud/commit/c9afc51b4d454efb9c2ff030cc993a0c47bc7a97)

#### [4.2.3](https://github.com/doesdev/scrud/compare/4.2.2...4.2.3)

> 24 July 2018

- Update deps [`cfb960e`](https://github.com/doesdev/scrud/commit/cfb960ee21efd78d021d19ce0cf2e6a627d4e0d0)
- Update changelog [`d73fe09`](https://github.com/doesdev/scrud/commit/d73fe0931300938b6eb8638e990f017d27ba788b)

#### [4.2.2](https://github.com/doesdev/scrud/compare/4.2.1...4.2.2)

> 30 April 2018

- Start working on scrud-realtime module [`b58ee1d`](https://github.com/doesdev/scrud/commit/b58ee1d360f60e8a6606faec08f32ad71da87eb9)
- Update changes for 4.2.1 [`9e83ecd`](https://github.com/doesdev/scrud/commit/9e83ecdb6465ef612d9a6fc984bd4ba653bd017b)
- Fix bug in http require when turbo not used [`73ddf39`](https://github.com/doesdev/scrud/commit/73ddf396a874da9e357ba15dd109adb5fe838b0c)

#### [4.2.1](https://github.com/doesdev/scrud/compare/4.2.0...4.2.1)

> 15 April 2018

- Add test for missing id, closes #13 [`#13`](https://github.com/doesdev/scrud/issues/13)
- Add hapi to bench [`df94097`](https://github.com/doesdev/scrud/commit/df94097955001e7c0302c5c5978b8f1fd0dbdc6d)
- Update benchmarked libs [`dfcfb8f`](https://github.com/doesdev/scrud/commit/dfcfb8f91d0a70464a5f78b5866746b41224ee61)
- Update deps, add auto-changelog [`9ac23dd`](https://github.com/doesdev/scrud/commit/9ac23dd4db01fb9e63e89c25114756d3d62bb5a5)
- Use turbo-http if parent app has it installed [`02ba07e`](https://github.com/doesdev/scrud/commit/02ba07e879a3afb8e5ec3ab7b4ff65a834af2506)
- Use turbo in bench [`01b7cf4`](https://github.com/doesdev/scrud/commit/01b7cf470b9497fcd311a4c0f329a1defe47b4b9)
- Readme tweak [`9da1f91`](https://github.com/doesdev/scrud/commit/9da1f91a99a6190e5586a18893b611eae9dd98f9)
- Fix whitespace [`fd67551`](https://github.com/doesdev/scrud/commit/fd675513a60aadcda445456ec44ffdac0b1fd2c6)
- Explicitly don't use turbo in benches [`0dd17c9`](https://github.com/doesdev/scrud/commit/0dd17c982b121f6a369643944b8a2c1a5c7556ee)
- Update bench image [`d48a4eb`](https://github.com/doesdev/scrud/commit/d48a4ebc8356c951d632ed53837552417b9bf138)
- Update description [`e6abc59`](https://github.com/doesdev/scrud/commit/e6abc59caf47eca1195883bf476c993e50114daa)

#### [4.2.0](https://github.com/doesdev/scrud/compare/4.1.4...4.2.0)

> 1 March 2018

- Readme overhaul, bump to 4.2.0 [`8d531c0`](https://github.com/doesdev/scrud/commit/8d531c0dc5eb87a90803919ed35cc103256e029e)
- Ensure all benches return proper content-type [`832e77f`](https://github.com/doesdev/scrud/commit/832e77f2df76678fd86b65cf63bd9af30804b67c)
- Update readme [`8df66b5`](https://github.com/doesdev/scrud/commit/8df66b5b1f39e0454c5a4d6699cf1b2e75178e87)
- Only call Buffer.byteLength if strlen*2 > limit [`4492f88`](https://github.com/doesdev/scrud/commit/4492f88d460b679048291d984af4ad352ea5f702)
- Don't cache in benchmarks [`eaac37c`](https://github.com/doesdev/scrud/commit/eaac37c1e9a377618aa1109f5e7cd84c71bb4715)
- Update readme [`7f632b2`](https://github.com/doesdev/scrud/commit/7f632b2ab49caa4851d6300a6b252fd8befc74ce)
- Update bench [`d9ee4dc`](https://github.com/doesdev/scrud/commit/d9ee4dcc9184e5bcb35589b59dbc3327f10afc3d)
- Add some assets [`db22061`](https://github.com/doesdev/scrud/commit/db22061f6c4561a6dd46b011430d1cc567d7f08a)

#### [4.1.4](https://github.com/doesdev/scrud/compare/4.1.3...4.1.4)

> 26 February 2018

- Handle another edge case [`6d59537`](https://github.com/doesdev/scrud/commit/6d595373627055f9763ce24fc9d3f18096472f75)

#### [4.1.3](https://github.com/doesdev/scrud/compare/4.1.2...4.1.3)

> 26 February 2018

- Fix gzip caching bug, 4.1.3 [`6323db6`](https://github.com/doesdev/scrud/commit/6323db641fa63786231fc20d9ff7736dd8cce31a)
- Add boolean to primitives [`3f89a32`](https://github.com/doesdev/scrud/commit/3f89a329fe9e3d9969a3179ee4cafc63ed328617)

#### [4.1.2](https://github.com/doesdev/scrud/compare/4.1.1...4.1.2)

> 26 February 2018

- Add more lob tooling, gzip caching [`b7cf1e1`](https://github.com/doesdev/scrud/commit/b7cf1e163674235e85ca0b74053fb268c66855c2)
- Cache expensive-ish where if we can [`d91d82d`](https://github.com/doesdev/scrud/commit/d91d82daa1559d1dd18cec957e5b8eeba3c018fc)
- Optimize benches to be more apples to apples [`97c881e`](https://github.com/doesdev/scrud/commit/97c881ef14a64f469b312a54dab58e52634552b2)
- Bump to 4.1.2 [`a10e8fc`](https://github.com/doesdev/scrud/commit/a10e8fc96cee0fd5712ab7c342006108b78a129c)

#### [4.1.1](https://github.com/doesdev/scrud/compare/4.1.0...4.1.1)

> 26 February 2018

- Memoization: great for benches ;) [`3618b63`](https://github.com/doesdev/scrud/commit/3618b634d96ba0dc078877a50527e8be9581538b)
- Ensure cached object is consistent in parseUrl [`af2945a`](https://github.com/doesdev/scrud/commit/af2945a669e75cd4154377c4e2c4e48c93eb33b2)
- Moar faster [`ed17aab`](https://github.com/doesdev/scrud/commit/ed17aabc6c0d51b3eb106e5a7c4ae82320ffbc88)

#### [4.1.0](https://github.com/doesdev/scrud/compare/4.0.1...4.1.0)

> 25 February 2018

- Add benchmarks, sad though they are :( [`5a35fca`](https://github.com/doesdev/scrud/commit/5a35fcadc3037ac657fa0c7360d89ff74f3291a3)
- Test before committing ;) [`1ae06dd`](https://github.com/doesdev/scrud/commit/1ae06dd2b5411db0e53744d209cfc12bc0e7a563)
- Fork all bench servers into child processes [`4b8ec72`](https://github.com/doesdev/scrud/commit/4b8ec72696969d6b2a2f79e465f3a9588eff879b)
- Benchmark memory usage as well [`2cfda43`](https://github.com/doesdev/scrud/commit/2cfda43170e052ff2b9446b17f25d6079c33b477)
- Optimize url parsing, no more regexery [`fe2ac88`](https://github.com/doesdev/scrud/commit/fe2ac882a7677ddc9445c0dd58a0b907276f6ad4)
- Parse id (read action) for all benches [`98a7a4c`](https://github.com/doesdev/scrud/commit/98a7a4c53cc9c84e23e1b3fc6cb862a260dd4983)
- Test a few edge cases related tp path parsing [`788b657`](https://github.com/doesdev/scrud/commit/788b6574b423bdc9fb9ffce548dee591d3e4f6eb)
- Ensure lib results are consistent [`0fd44b0`](https://github.com/doesdev/scrud/commit/0fd44b05d2d04e01ba43828c30915fe713193014)
- Random bench order, warmup, skip auth if no jwtOpts [`d3b904d`](https://github.com/doesdev/scrud/commit/d3b904d10dd6c3754a26ebd0c74a79b88166cdf0)
- Bench table tweaks [`050f73d`](https://github.com/doesdev/scrud/commit/050f73dc7632dbc8f1774a197971d4c81a467269)
- Make getIp and setScrudHeader options [`7d7f8cb`](https://github.com/doesdev/scrud/commit/7d7f8cb6baca7aa744f85324a860950a837fc7ad)
- Setup lob bench [`b844b70`](https://github.com/doesdev/scrud/commit/b844b7099b578fac8ae755c34c2fe253b940387f)
- Up connections in bench, micro tweak in handler [`4d7337a`](https://github.com/doesdev/scrud/commit/4d7337ae3af54398944a7fa1f43c924b72dec635)
- Only require jsonwebtoken and pg if applicable [`f85329f`](https://github.com/doesdev/scrud/commit/f85329f2142ab3c65f696637fde627742c921bd4)
- Use urlTemplate for consistency check and bench [`3beb384`](https://github.com/doesdev/scrud/commit/3beb3843144095c1dec9bf3579b282f9625b0034)
- Tweak gzip headers, middle of the pack bench [`1b3cb30`](https://github.com/doesdev/scrud/commit/1b3cb309e898dc67d7e2d00c5b8729853eaf1322)
- Unbreak my heart / the entire thing [`da61822`](https://github.com/doesdev/scrud/commit/da618222b38fa685441bc0cd0d4b2944336e8a51)
- Set bench durations back [`0798753`](https://github.com/doesdev/scrud/commit/0798753d1eb66b11ee09cd22efd409bf7296685c)
- Only get id if needed [`66d4a70`](https://github.com/doesdev/scrud/commit/66d4a70fe5525fe595a8a70246d321b5e4a36af6)
- Only get token if needed [`e1301ca`](https://github.com/doesdev/scrud/commit/e1301cab8b67ce86bf8ed7088ba87eebcf38fbab)
- Optimized release, close in on polka/http [`e72f397`](https://github.com/doesdev/scrud/commit/e72f3972d8a15b965a0e2b47cbc3c2be18c1279c)
- Remove redundant basePath check [`bbe8a15`](https://github.com/doesdev/scrud/commit/bbe8a1576dba849c38ae4de90185677d926f9f0c)

#### [4.0.1](https://github.com/doesdev/scrud/compare/4.0.0...4.0.1)

> 21 February 2018

- Update dependencies, 4.0.1 [`76aa007`](https://github.com/doesdev/scrud/commit/76aa007f9bc0afaf4c9a6526ff55075f0683af27)

### [4.0.0](https://github.com/doesdev/scrud/compare/3.0.1...4.0.0)

> 29 November 2017

- Changes to API for helper functions, 4.0.0 [`ec49a64`](https://github.com/doesdev/scrud/commit/ec49a6415d7efa9d060f5ec19b436e036fe61305)

#### [3.0.1](https://github.com/doesdev/scrud/compare/3.0.0...3.0.1)

> 29 November 2017

- Alias exported SCRUD functions, 3.0.1 [`10c500d`](https://github.com/doesdev/scrud/commit/10c500de3ba0ccd59e6f87e5f920a20075c70550)

### [3.0.0](https://github.com/doesdev/scrud/compare/2.1.0...3.0.0)

> 28 November 2017

- Test jwt, fix regression, semver breaking change [`1904724`](https://github.com/doesdev/scrud/commit/1904724f645997a40ff2de528708b30b91fc168a)

#### [2.1.0](https://github.com/doesdev/scrud/compare/v2.0.5...2.1.0)

> 28 November 2017

- Update deps, version 2.1.0 [`f32043d`](https://github.com/doesdev/scrud/commit/f32043d78a6ef2d8aba6b03614419cdf38c93def)

#### [v2.0.5](https://github.com/doesdev/scrud/compare/v2.0.4...v2.0.5)

> 5 September 2017

- Update deps, v2.0.5, skip untestable test [`1771779`](https://github.com/doesdev/scrud/commit/17717792a6835e6961c2490658233ecc553bb2bd)

#### [v2.0.4](https://github.com/doesdev/scrud/compare/v2.0.3...v2.0.4)

> 1 August 2017

- Check before calling removeListener, v2.0.4 [`e7988de`](https://github.com/doesdev/scrud/commit/e7988de064fab0e30c27194d9504225454e27e2a)

#### [v2.0.3](https://github.com/doesdev/scrud/compare/v2.0.2...v2.0.3)

> 1 August 2017

- Actually reject error in callPgFunc, v2.0.3 [`08fdd05`](https://github.com/doesdev/scrud/commit/08fdd05288430b04019965cea3c753d1fcfb6d12)

#### [v2.0.2](https://github.com/doesdev/scrud/compare/v2.0.1...v2.0.2)

> 31 July 2017

- Remove unused semver package [`f0ed6d3`](https://github.com/doesdev/scrud/commit/f0ed6d399f789913815e056c143106ad96d211d1)

#### [v2.0.1](https://github.com/doesdev/scrud/compare/v2.0.0...v2.0.1)

> 29 July 2017

- Listen for close once, don't log client end err [`9d9c617`](https://github.com/doesdev/scrud/commit/9d9c617c83ca827978d1b1f711f530ca7f40844e)

### [v2.0.0](https://github.com/doesdev/scrud/compare/v1.0.16...v2.0.0)

> 29 July 2017

- Close pg client on req term, closes #12 [`#12`](https://github.com/doesdev/scrud/issues/12)
- Fix #9 [`#9`](https://github.com/doesdev/scrud/issues/9)
- Fix #11, make tests mo better [`#11`](https://github.com/doesdev/scrud/issues/11)
- Start on 2.0.0, deprecate instance, closes #8 [`#8`](https://github.com/doesdev/scrud/issues/8)
- Refactor pg handlers [`d514d86`](https://github.com/doesdev/scrud/commit/d514d862635629f57675eb91df3c9bd2eaf41eb7)
- Breaking: change pg helpers signature [`28a140a`](https://github.com/doesdev/scrud/commit/28a140aeab129fb88365e2d88ec7958ec9b8f571)
- Use pg promises instead of cb [`8239b48`](https://github.com/doesdev/scrud/commit/8239b48c8cae8a5a215029d5a348bc473d01aa2b)
- Id error in line [`6474946`](https://github.com/doesdev/scrud/commit/64749464357341fbe3b85d3875a8516dae1b94d5)
- Null id if string null or undefined [`4a63325`](https://github.com/doesdev/scrud/commit/4a633253f27ca868516769694624eabc0a893e03)
- Fix create test to throw properly on fail [`282c277`](https://github.com/doesdev/scrud/commit/282c27738e15fcddfaf6b6a7d1499eb95063e131)
- Version 2.0.0 [`6904b9c`](https://github.com/doesdev/scrud/commit/6904b9cda6d16d4f59bb4f7b340b8b9ca71f0b30)
- Add deps badge [`2065a6b`](https://github.com/doesdev/scrud/commit/2065a6b8d26c32099478077daab0586d8c8011a4)

#### v1.0.16

> 21 July 2017

- Add timeout option, closes #7 [`#7`](https://github.com/doesdev/scrud/issues/7)
- Implement GZIP compression, closes #4 [`#4`](https://github.com/doesdev/scrud/issues/4)
- Implement CORS handling, closes #3 [`#3`](https://github.com/doesdev/scrud/issues/3)
- Handle preflight requests, closes #2 [`#2`](https://github.com/doesdev/scrud/issues/2)
- Closes #1, set content type prior to any send [`#1`](https://github.com/doesdev/scrud/issues/1)
- Fix logger, allow separate instances [`64c8b64`](https://github.com/doesdev/scrud/commit/64c8b6477fbbd850464bdd5fd0099e2d506e30e4)
- Update deps [`5926d89`](https://github.com/doesdev/scrud/commit/5926d89398c05a2824f3c1b8c6ca3d0141cbdc8f)
- Add documentation [`b844ebe`](https://github.com/doesdev/scrud/commit/b844ebe4231e75fc8268b04c3d97c98a46901754)
- Initial scaffold [`cdff96b`](https://github.com/doesdev/scrud/commit/cdff96badef627e0508cb2ff882640721f8fd405)
- Expose send and err helpers [`451a392`](https://github.com/doesdev/scrud/commit/451a392f17b00934e482f679c4b9ebacd994b5a0)
- Resource methods to single handler, before hooks [`b3d2487`](https://github.com/doesdev/scrud/commit/b3d24878a74225f2a29711c836509501c15a61b6)
- Add skeletons of exports, failing register tests [`68b9770`](https://github.com/doesdev/scrud/commit/68b9770c52f8105bb5d5261d5585bdb1bd2b15de)
- Refactor res.end calls, add authenticate opt [`7b5bb56`](https://github.com/doesdev/scrud/commit/7b5bb5639b9f8ee89809b4287acc607e0843528a)
- Change module name to scrud [`104f3c1`](https://github.com/doesdev/scrud/commit/104f3c13cb7b7c363abdc0f6099133726c0b1625)
- Implement update [`59e1e5d`](https://github.com/doesdev/scrud/commit/59e1e5d58268fb2146526e485159e1b45276e6d9)
- Clean up tests a bit [`aaf7c6a`](https://github.com/doesdev/scrud/commit/aaf7c6a22dcbd8b2790d5f7c46b098aee222a26c)
- Implement create [`af36ec3`](https://github.com/doesdev/scrud/commit/af36ec39345b6b884a8fe696ee050528de96737e)
- Add id and params parsers [`754fa50`](https://github.com/doesdev/scrud/commit/754fa506268407d533a7a511994e97c65e5065d1)
- Start on server, client fails with ECONNNREFUSED [`9cafec9`](https://github.com/doesdev/scrud/commit/9cafec90157b9802756c5b34feaecc9dd2d3085a)
- Remap auth, pass params to all actions [`de9d477`](https://github.com/doesdev/scrud/commit/de9d47709f6e012d8a1e5bd817bf0eac03a2b28c)
- Remove helpers dir, add auth handler [`06dd7d4`](https://github.com/doesdev/scrud/commit/06dd7d47378cd9677c6491e7d8aa43f004e61f75)
- Barely started on routes [`649a448`](https://github.com/doesdev/scrud/commit/649a448018116d5d4f34bf93e7e84a0d42ad43fc)
- Implement search, test returned data attributes [`bae7021`](https://github.com/doesdev/scrud/commit/bae70219cbb284c93f11660b2b60088c2f418dfc)
- Remove design notes from tests [`fc3e785`](https://github.com/doesdev/scrud/commit/fc3e785101e53ad2874e80cb11f71c49503ac245)
- More work on routes [`e3225ff`](https://github.com/doesdev/scrud/commit/e3225ffecbfccd0bf0a163c1e2082c771aff333b)
- Add for common action handling bits [`86a22da`](https://github.com/doesdev/scrud/commit/86a22da78c000ee2f1ab99ef6e8bf41454fb299a)
- Basic SCRUD routing implemented [`2c1ed81`](https://github.com/doesdev/scrud/commit/2c1ed8177596c9a1cac128a550665872744f5950)
- Parse body before calling handler [`f7e065e`](https://github.com/doesdev/scrud/commit/f7e065e24e870a914a0ec3674e55891114c09fca)
- Start scaffolding default handlers [`d252cf0`](https://github.com/doesdev/scrud/commit/d252cf0047ce43abd53cbca9378bc40abbef3923)
- Implement read [`15e7de2`](https://github.com/doesdev/scrud/commit/15e7de2c28bb296fdc2a86a4f99ddbc5ec4e02f7)
- If no origin header treat req as same origin [`73ddb87`](https://github.com/doesdev/scrud/commit/73ddb8741cbbe27071682069cd452eb83ea8a75d)
- Send error on cors rejection, standardize error's [`6160f2c`](https://github.com/doesdev/scrud/commit/6160f2cfb38750d9452d9e66ab630e7d8f7a0358)
- Less regexery, encode/decode handling and tests [`dcc27d0`](https://github.com/doesdev/scrud/commit/dcc27d0a2caca43083efb0b91434037768f01328)
- Add helper specifications [`c323fe5`](https://github.com/doesdev/scrud/commit/c323fe5865c5a185e271f1521e34f1230a8c9a7a)
- Use tiny-params module [`a68d9a7`](https://github.com/doesdev/scrud/commit/a68d9a787e131282d1d8834bae9b3b7ed3491cfd)
- Filter sign opts [`76da868`](https://github.com/doesdev/scrud/commit/76da868812f240fe6557cac4e6b9f5415424d41c)
- Start designing api [`205fc75`](https://github.com/doesdev/scrud/commit/205fc75859fedfcbc271599cb600edf959114fef)
- Start on pg client [`82cc8ce`](https://github.com/doesdev/scrud/commit/82cc8cecb004344e731633238525d96cb7a8165b)
- Allow for skipping auth [`f075802`](https://github.com/doesdev/scrud/commit/f07580201ac13e29cb68fa3fa47f8a8fed317210)
- Add resource object specification [`7d9f46b`](https://github.com/doesdev/scrud/commit/7d9f46b64c4a1c15fabd98807d185aeb25a0657c)
- Ensure headers haven't sent prior to send [`2b1ee4a`](https://github.com/doesdev/scrud/commit/2b1ee4add93e63ff3f25c15a3123c55df5a69944)
- Move SCRUD identifier to headers [`47322be`](https://github.com/doesdev/scrud/commit/47322be0353b2a0f314bae1778a9f21bf9fc4fc4)
- Add jwt generator [`96f9ea4`](https://github.com/doesdev/scrud/commit/96f9ea40a08ce9294a120c51f78f14d460300438)
- Standardize returned JSON object [`f766e64`](https://github.com/doesdev/scrud/commit/f766e6472d96b830ddf6e89ae609c4078b5c1b74)
- Pass name to actionWrapper [`119b484`](https://github.com/doesdev/scrud/commit/119b4843ff5d153756e92b059408d189ca538c2a)
- Add link to CRUD wiki [`96d686d`](https://github.com/doesdev/scrud/commit/96d686d2207174690f23f3cfab6d815ddd1f2bb0)
- Update deps, bump to 1.0.3 [`1abfb87`](https://github.com/doesdev/scrud/commit/1abfb872ffa51e63582b0562d6c80a6d6788dcd1)
- Add logging callback [`06cb7c2`](https://github.com/doesdev/scrud/commit/06cb7c2f6104ae54d62182426fb5135fc6a00bfb)
- Parse err if PG fails with JSON like error object [`cc3acff`](https://github.com/doesdev/scrud/commit/cc3acff8be1a376300dd86164d365cc4fe6d6013)
- Assign resource props to new obj, update deps [`2100a39`](https://github.com/doesdev/scrud/commit/2100a39a2b2e87307d8c38a091834bda0d51ab45)
- Handle no error with headers not sent [`d1367d8`](https://github.com/doesdev/scrud/commit/d1367d847fdf82286049536a4681a77071161b03)
- Roles remapping doesn't belong in scrud [`4fdbb00`](https://github.com/doesdev/scrud/commit/4fdbb00ad4c3d0bed699be5b922350b7d6796060)
- Pass log level to logger [`2fd61d1`](https://github.com/doesdev/scrud/commit/2fd61d1497b21fe3e96b9745870680372c13c420)
- Pass IP in params [`edd7ae9`](https://github.com/doesdev/scrud/commit/edd7ae9e7b2118afb7d3a00bac1399dcd14443d0)
- Remove console logs [`91e42f4`](https://github.com/doesdev/scrud/commit/91e42f478c186c83ab016adb3a03ac1149b3c3ed)
- Add error meta data in pg call [`69d6cb7`](https://github.com/doesdev/scrud/commit/69d6cb7f181f92714002d1ec839c68f0fe081c0a)
- Fix helper specs [`02c7451`](https://github.com/doesdev/scrud/commit/02c745153f4f121982db52def9a68c8eca0d9f27)
- Stringify object on send [`c8b1225`](https://github.com/doesdev/scrud/commit/c8b122548409efe009c9a0db2871024b3d2a3e17)
- Fix description in readme [`1196651`](https://github.com/doesdev/scrud/commit/1196651ea548f19dc90134d94a1febc3901c0101)
- Get resource object in handleRequest [`2a7d510`](https://github.com/doesdev/scrud/commit/2a7d51068bfe1c7c04d58ff0e8bffddc0e73842e)
- Export logIt as a courtesy ;) [`5fe3602`](https://github.com/doesdev/scrud/commit/5fe360276fed7a16435f384ee8c6c20f64510ec6)
- Allow for auth transformer [`19a5354`](https://github.com/doesdev/scrud/commit/19a5354d8644e530cd98ac6498c58ee4ae883695)
- Update tiny-params, bump version [`9767eca`](https://github.com/doesdev/scrud/commit/9767ecaf0431f0cc9fff25cba1197a88c75daeb5)
- Update tinyparams, version bump [`e575e42`](https://github.com/doesdev/scrud/commit/e575e42cbe7089a7ae56ea2f3e170e3072813540)
- Update tinyparams [`c627a38`](https://github.com/doesdev/scrud/commit/c627a38994d84141fb6ae476c7fe116dff6efb1b)
- Remove content-encoding header on error [`ff8dae1`](https://github.com/doesdev/scrud/commit/ff8dae1d78814dce2ca305d199719f0b64f4b149)
- Don't init, just start [`8f0f80b`](https://github.com/doesdev/scrud/commit/8f0f80b957e4edbcc20c09d83f39f1b5e233536c)
- Don't remove original key when setting array key [`506e0d1`](https://github.com/doesdev/scrud/commit/506e0d15491a3b8b10311871bfe15e4acfff4391)
- Bump to v1.0.15 [`fd8c81c`](https://github.com/doesdev/scrud/commit/fd8c81c1553c5a6c6d348edc2bf49e1a4be0d827)
- Set status code correctly [`cf589c1`](https://github.com/doesdev/scrud/commit/cf589c1b8685f4c19fe0614d5ef9a02f722f674b)
- Handle no data in verify [`91758bd`](https://github.com/doesdev/scrud/commit/91758bdce81031d5867fc026c5509947634e316c)
- Bump to 1.0.13 [`95710a3`](https://github.com/doesdev/scrud/commit/95710a382d262e31f76a9575cf9a383392e115cf)
- Update PG [`ea26ffc`](https://github.com/doesdev/scrud/commit/ea26ffc8eca8c767a71f1fb863073580455669c3)
- Bump to v1.0.7 [`02ba547`](https://github.com/doesdev/scrud/commit/02ba547e27576cbfe667b1bf8a8eccd1f3bda7b5)
- Data null instead of undefined [`9083e3e`](https://github.com/doesdev/scrud/commit/9083e3efacb6faf07cc5fa8ddd3f9f651f9d8ec1)
- Version 1.0.9 [`e62bb78`](https://github.com/doesdev/scrud/commit/e62bb78f15bb4854740a97da3a198801bdffdd8f)
- Fix files in package.json [`a4d9b92`](https://github.com/doesdev/scrud/commit/a4d9b929e8c7f0f4c9776202c35d02e4bfcf8cd3)
- Mark WIP so we can push module to hold name [`f3b710c`](https://github.com/doesdev/scrud/commit/f3b710c758de74fb2f4dc1c5d9f49583d3f11d0e)
- Pass auth to pg [`56d383c`](https://github.com/doesdev/scrud/commit/56d383c109f1a85e0ace2679291333dfdcb88ce5)
- Comment on resource handler overrides [`eb7c54f`](https://github.com/doesdev/scrud/commit/eb7c54fe77cd0ba1e967e0a168aefbf0cc052e17)
- Version 1.0.2 [`3964534`](https://github.com/doesdev/scrud/commit/3964534547c140b6a6cccb2de38fcc3b1bcdf8af)
- Handle creates with trailing slash [`a7bfc61`](https://github.com/doesdev/scrud/commit/a7bfc613ee02ea74c303e958e67a602aa5952557)
- Allow for search with no params [`362ce36`](https://github.com/doesdev/scrud/commit/362ce36ea6a09850fcabe31c4704df9cb515a579)
- Remove console.log [`e97c467`](https://github.com/doesdev/scrud/commit/e97c467a76ca91c076aa759be1f6689f8f9cae47)
- Set Content-Type [`a4144b2`](https://github.com/doesdev/scrud/commit/a4144b2f79a48d1a9860568f9bf48636e38e692e)
