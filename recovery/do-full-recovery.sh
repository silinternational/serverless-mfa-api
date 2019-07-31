#!/usr/bin/env bash

# Exit script with error if any step fails.
set -e

echo ""

echo "*** NOTE: ***"
echo "Most of this process will use your default AWS CLI profile (aka "
echo "credentials). It should probably have credentials from an IAM user "
echo "on the target AWS account who has admin privileges. [Press Enter to "
echo "continue] "
read unusedVariable1
echo ""

echo "*** WARNING ***"
echo "You should ONLY run this from the root folder of your local copy of the "
echo "Serverless MFA API's files. You are currently in the following folder: "
pwd
echo "Please cancel this if that is not the appropriate folder. [Press Enter to continue] "
read unusedVariable2
echo ""

echo ""
echo "--------------------- Preparing to download backups ---------------------"
echo ""

echo "Which AWS CLI profile should we use to download the backup data from the "
echo "existing Serverless MFA API that you are trying to recover. "
echo "EXAMPLE: sourceAWSaccount-dynamodb-backup-manager-yourname"
read awsProfileForDownloadingBackups
echo ""

echo "What is the S3 bucket where those backups are stored? "
echo "EXAMPLE: sourceAWSaccount.backups.dynamodb.mfa-api "
read s3bucketToRestoreFrom
echo ""

aws s3 sync \
    --acl private \
    --sse AES256 \
    --profile "${awsProfileForDownloadingBackups}" \
    "s3://${s3bucketToRestoreFrom}" \
    "recovery/TempCopyOfBackups/"

echo ""
echo "---------- Preparing to deploy new copy of serverless-mfa-api -----------"
echo ""

echo "What should we call this instance of the Serverless MFA API? "
echo "*** WARNING ***: The production copy is probably called mfa-api, so "
echo "DO NOT use that unless you want to overwrite your existing production "
echo "copy of the Serverless MFA API (which I have never tried). To deploy a "
echo "separate copy (especially for testing), use some other name (such as "
echo "mfa-api-test-1). "
read newServiceName
echo ""

echo "Which stage (dev or prod) should we deploy? "
read stage
echo ""

echo "Which AWS region should we deploy to? "
echo "EXAMPLE: us-east-1"
read targetRegion
echo ""

serverless deploy -v \
    --stage "${stage}" \
    --region "${targetRegion}" \
    --service "${newServiceName}"

echo ""
echo "---------------------- Installing backups library -----------------------"
echo ""

sudo npm install gulp-cli -g
sudo npm i -g npm

cd ./recovery

curl --fail --location --remote-name https://github.com/silinternational/DynamoDbBackUp/archive/master.zip
unzip master.zip
rm master.zip
mv DynamoDbBackUp-master DynamoDbBackUp

cd DynamoDbBackUp

npm install

cd ../..

echo ""
echo "------------- Preparing to upload backups to new S3 bucket --------------"
echo ""

echo "What name do you want to use for the new S3 Bucket where backups will be "
echo "stored? "
echo "EXAMPLE: targetAWSaccount.backups.dynamodb.${newServiceName}"
read newS3bucketName
echo ""

cd ./recovery/DynamoDbBackUp

gulp deploy-s3-bucket \
    --s3bucket "${newS3bucketName}" \
    --s3region "${targetRegion}"

aws s3api put-bucket-acl \
    --acl private \
    --bucket "${newS3bucketName}"

aws s3 sync \
    --acl private \
    --sse AES256 \
    --content-type "application/json" \
    "../TempCopyOfBackups/" \
    "s3://${newS3bucketName}"

cd ../..

echo ""
echo "----------- Loading backup data into the new DynamoDB tables -------------"
echo ""

cd ./recovery/DynamoDbBackUp

timestampWithMs=$(date +%s000)
oldServiceNameGuess=$(ls ../TempCopyOfBackups/ | sed 's/_.*$//' | uniq)

echo "What is the name used for the serverless-mfa-api that you are restoring "
echo "data from? The default is mfa-api, and it looks like it is one of these: "
echo "${oldServiceNameGuess}"
read oldServiceName
echo ""

gulp restore \
    --s3bucket "${newS3bucketName}" \
    --s3prefix "${oldServiceName}_${stage}_api-key" \
    --s3region "${targetRegion}" \
    --dbtable "${newServiceName}_${stage}_api-key" \
    --dbregion "${targetRegion}" \
    --restoretime ${timestampWithMs}

gulp restore \
    --s3bucket "${newS3bucketName}" \
    --s3prefix "${oldServiceName}_${stage}_totp" \
    --s3region "${targetRegion}" \
    --dbtable "${newServiceName}_${stage}_totp" \
    --dbregion "${targetRegion}" \
    --restoretime ${timestampWithMs}

gulp restore \
    --s3bucket "${newS3bucketName}" \
    --s3prefix "${oldServiceName}_${stage}_u2f" \
    --s3region "${targetRegion}" \
    --dbtable "${newServiceName}_${stage}_u2f" \
    --dbregion "${targetRegion}" \
    --restoretime ${timestampWithMs}

cd ../..

echo ""
echo "------- Starting automated backups of this new Serverless MFA API -------"
echo ""

cd ./recovery/DynamoDbBackUp

gulp deploy-lambda \
    --s3bucket "${newS3bucketName}" \
    --s3prefix "${newServiceName}_${stage}_api-key" \
    --s3region "${targetRegion}" \
    --dbregion "${targetRegion}" \
    --lName "backup_dynamodb_${newServiceName}_${stage}_api-key" \
    --lRegion "${targetRegion}" \
    --lAlias active \
    --lRoleName LambdaBackupDynamoDBToS3 \
    --lTimeout 60

gulp deploy-lambda \
    --s3bucket "${newS3bucketName}" \
    --s3prefix "${newServiceName}_${stage}_totp" \
    --s3region "${targetRegion}" \
    --dbregion "${targetRegion}" \
    --lName "backup_dynamodb_${newServiceName}_${stage}_totp" \
    --lRegion "${targetRegion}" \
    --lAlias active \
    --lRoleName LambdaBackupDynamoDBToS3 \
    --lTimeout 60

gulp deploy-lambda \
    --s3bucket "${newS3bucketName}" \
    --s3prefix "${newServiceName}_${stage}_u2f" \
    --s3region "${targetRegion}" \
    --dbregion "${targetRegion}" \
    --lName "backup_dynamodb_${newServiceName}_${stage}_u2f" \
    --lRegion "${targetRegion}" \
    --lAlias active \
    --lRoleName LambdaBackupDynamoDBToS3 \
    --lTimeout 60


gulp deploy-lambda-event \
    --dbtable "${newServiceName}_${stage}_api-key" \
    --dbregion "${targetRegion}" \
    --lName "backup_dynamodb_${newServiceName}_${stage}_api-key" \
    --lRegion "${targetRegion}" \
    --lAlias active

gulp deploy-lambda-event \
    --dbtable "${newServiceName}_${stage}_totp" \
    --dbregion "${targetRegion}" \
    --lName "backup_dynamodb_${newServiceName}_${stage}_totp" \
    --lRegion "${targetRegion}" \
    --lAlias active

gulp deploy-lambda-event \
    --dbtable "${newServiceName}_${stage}_u2f" \
    --dbregion "${targetRegion}" \
    --lName "backup_dynamodb_${newServiceName}_${stage}_u2f" \
    --lRegion "${targetRegion}" \
    --lAlias active

cd ../..

echo ""
echo "----- Doing full backup to ensure new S3 bucket items are encrypted -----"
echo ""

cd ./recovery/DynamoDbBackUp

gulp backup-full \
    --s3bucket "${newS3bucketName}" \
    --s3prefix "${newServiceName}_${stage}_api-key" \
    --s3region "${targetRegion}" \
    --dbtable "${newServiceName}_${stage}_api-key" \
    --dbregion "${targetRegion}" \

gulp backup-full \
    --s3bucket "${newS3bucketName}" \
    --s3prefix "${newServiceName}_${stage}_totp" \
    --s3region "${targetRegion}" \
    --dbtable "${newServiceName}_${stage}_totp" \
    --dbregion "${targetRegion}" \

gulp backup-full \
    --s3bucket "${newS3bucketName}" \
    --s3prefix "${newServiceName}_${stage}_u2f" \
    --s3region "${targetRegion}" \
    --dbtable "${newServiceName}_${stage}_u2f" \
    --dbregion "${targetRegion}" \

cd ../..
