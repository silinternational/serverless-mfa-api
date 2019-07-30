#!/usr/bin/env bash

# Exit script with error if any step fails.
set -e

echo ""

echo "*** NOTE: ***"
echo "This process will use your default AWS CLI profile (aka credentials)."
echo ""

echo "What should we call this instance of the Serverless MFA API? "
echo "*** WARNING ***: The production copy is probably called mfa-api, so DO NOT use that unless you want to overwrite "
echo "your existing production copy of the Serverless MFA API. For testing, or to deploy a separate copy, use some "
echo "other name (such as mfa-api-test-1). "
read serviceName
echo ""

echo "Which stage (dev or prod) should we deploy? "
read stage
echo ""

echo "Which AWS region should we deploy to? "
echo "EXAMPLE: us-east-1"
read region
echo ""

serverless deploy -v --stage "${stage}" --region "${region}" --service "${serviceName}"
