#!/usr/bin/env bash

# Exit script with error if any step fails.
set -e

# Echo out all commands for monitoring progress
set -x

# Print the Serverless version in the logs
serverless --version

echo "Deploying stage $1..."
serverless deploy --verbose --stage "$1"
