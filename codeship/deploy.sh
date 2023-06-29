#!/usr/bin/env bash

# Exit script with error if any step fails.
set -e

# Echo out all commands for monitoring progress
set -x

# Print the Serverless version in the logs
serverless --version

# NOTE: The regions are hard-coded here (to specify where the AWS Lambda
# functions should be deployed to), but are provided via variables in terraform
# (to control where the DynamoDB GlobalTables exist). If you want them to be in
# the same regions, set the terraform variables to match these:
echo "Deploying stage $1..."
serverless deploy --verbose --stage "$1" --region us-east-1
serverless deploy --verbose --stage "$1" --region us-west-2
