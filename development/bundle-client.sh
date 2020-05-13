#!/usr/bin/env bash

set -e

cp node_modules/\@webauthn/client/dist/main.js development/site/webauthn-client.js
cp node_modules/psl/dist/psl.min.js development/site/psl.min.js

rollup --config development/rollup.config.js --watch
