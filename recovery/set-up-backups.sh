#!/usr/bin/env bash

# Exit script with error if any step fails.
set -e

echo ""

echo "What did you call the instance of the Serverless MFA API that these backups are for? "
echo "EXAMPLE: mfa-api-test-1"
read serviceName
echo ""

echo "What name do you want to use for the S3 Bucket where backups are stored? "
echo "EXAMPLE: yourorg.backups.dynamodb.${serviceName}"
read s3bucketName
echo ""

echo "Which AWS region should we deploy to? "
echo "EXAMPLE: us-east-1"
read region
echo ""

cd ./recovery/DynamoDbBackUp

gulp deploy-s3-bucket \
    --s3bucket  "${s3bucketName}" \
    --s3region "${region}"
