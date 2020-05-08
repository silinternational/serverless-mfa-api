#!/usr/bin/env bash

set -e

cp node_modules/\@webauthn/client/dist/main.js development/site/webauthn-client.js

rollup --config development/rollup.config.js --watch
