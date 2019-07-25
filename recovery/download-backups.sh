#!/usr/bin/env bash

# Exit script with error if any step fails.
set -e

echo "Which profile (from the file created by 'aws configure') should we use for AWS calls? "
echo "EXAMPLE: yourorg-your-iam-name"
read awsProfileName
echo ""

echo "What is the S3 bucket where the backups are stored? "
echo "EXAMPLE (entire bucket): yourorg.backups.dynamodb.mfa-api "
read s3bucket
echo ""

echo "What local folder do you want the files saved to? Please use an absolute path (but NO quotes). "
read localTargetFolder
echo ""

aws s3 sync --acl private --sse AES256 --profile "${awsProfileName}" "s3://${s3bucket}" "${localTargetFolder}"
