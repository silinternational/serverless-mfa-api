#!/usr/bin/env bash

# Exit script with error if any step fails.
set -e

# Specify the desired version of NodeJS. Should match package.json, Dockerfiles,
# and serverless.yml file.
nvm use 16

npm install --no-fund -g serverless@3
npm install --no-fund
