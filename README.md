# Persisted Requests

[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://GitHub.com/Naereen/StrapDown.js/graphs/commit-activity)
[![made-with-javascript](https://img.shields.io/badge/Made%20with-JavaScript-1f425f.svg)](https://www.javascript.com)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://github.com/tehtea/persisted-requests/blob/main/LICENSE)

This library allows REST requests to be made from a client without the original context of the request becoming lost in the event the user moves away from the website, or if the page crashes.

This is done by persisting each request in storage before it is sent out. By default, the request then gets removed from storage after it is fulfilled by the server.

## Installation Steps

Using NPM: `npm install --save persisted-requests`

Using Yarn: `yarn add persisted-requests`

## Supported Environments
- Firefox
- Chrome
- Safari

See the `browsers` section of `karma.conf.js` for the list of browsers for which tests were ran on.

## Supported Persistence Types
- LocalStorage
- In-Memory

## Supported REST Client
Only Axios is supported for now, future support for other clients will be contingent on the usage of this library.

## Unsupported / Untested Request Features
- Cookies
- The following Request Body types:
    - XPath
    - XML
    - XML Schema
    - JSON Schema
    - regular expression
    - plain text

## Testing
Only end-to-end testing was done for now due to the relative small size of this project. See the `tests` folder for them.

The tests can be run by calling `npm run test`. `Karma` was used with `Jasmine` to run
them in the browser, with `Jasmine-Ajax` used for capturing the requests sent using an `XMLHTTPRequest()` spy.

Make sure to set `"declaration": false` in `tsconfig.json` before running tests.
This is a tech debt to clean up.

## Demo

The [demo app](https://tehtea.github.io/persisted-requests) contains example usage for this library, and also demonstrates what it does under the hood.