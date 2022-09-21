#!/usr/bin/env bash

# Exit script with error if any step fails.
set -e

# Check which version of NodeJS we're running.
node --version

npm install --no-fund -g serverless@3
npm ci --no-fund
