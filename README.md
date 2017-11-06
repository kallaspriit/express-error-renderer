# Express.js error renderer middleware

[![Travis](https://img.shields.io/travis/kallaspriit/express-error-renderer.svg)](https://travis-ci.org/kallaspriit/express-error-renderer)
[![Coverage](https://img.shields.io/coveralls/kallaspriit/express-error-renderer.svg)](https://coveralls.io/github/kallaspriit/express-error-renderer)
[![Downloads](https://img.shields.io/npm/dm/express-error-renderer.svg)](http://npm-stat.com/charts.html?package=express-error-renderer&from=2015-08-01)
[![Version](https://img.shields.io/npm/v/express-error-renderer.svg)](http://npm.im/express-error-renderer)
[![License](https://img.shields.io/npm/l/express-error-renderer.svg)](http://opensource.org/licenses/MIT)

**Middleware for pretty rendering of your errors complete with source-mapped stack traces.**

- Can be configured for development or production (no error details showed in production).
- Includes simple example application with tests.
- Shows error details with both compiled and source mapped stack traces.
- Returns configurable JSON error payloads for XHR requests.
- Uses [PrismJS](http://prismjs.com) to pretty-render the stack traces
- Written in [TypeScript](https://www.typescriptlang.org/).
- Includes [100% test coverage](https://coveralls.io/github/kallaspriit/express-error-renderer).

## Installation

This package is distributed via npm

```cmd
npm install express-error-renderer
```

## Commands

- `yarn build` to build the production version.
- `yarn test` to run tests.
- `yarn lint` to lint the codebase.
- `yarn start` to start the example application.
- `yarn coverage` to gather code coverage.
- `yarn prettier` to run prettier.

## Example

See `src/example` directory for a full working example code and run `npm start` to try it out for yourself.

![Error example](https://github.com/kallaspriit/express-error-renderer/blob/master/screenshots/error.png)