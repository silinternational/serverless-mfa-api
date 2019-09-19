#!/usr/bin/env bash

# Exit script with error if any step fails.
set -e

tableSuffixes='api-key totp u2f'

echo ""
echo "---------------------------- Instructions -------------------------------"
echo ""

echo "*** NOTE: ***"
echo "This script is designed to be idempotent, so if some step fails, you can "
echo "simply re-run this script after you have fixed the problem. "
echo "[Press Enter to continue] "
read unusedVariable1
echo ""

echo "*** NOTE 2: ***"
echo "Most of this process will use your default AWS CLI profile (aka "
echo "credentials). It should probably have credentials from an IAM user "
echo "on the target AWS account who has admin privileges. "
echo "[Press Enter to continue] "
read unusedVariable2
echo ""

echo ""
echo "--------------------- Configuring AWS CLI profiles ----------------------"
echo ""

echo "Please enter the AWS Access Key ID/Secret for the source AWS account, "
echo "which we will use to download the backup data from S3."
echo ""
echo "For the default region, use the region where the current Serverless MFA "
echo "API is running (probably us-east-1). The Default output format can be "
echo "left blank."
aws configure --profile restore-s3-backups
echo ""

echo "Now please enter the AWS Access Key ID/Secret for the target AWS "
echo "account, which we will use to create the new copy of the Serverless MFA "
echo "API. "
echo ""
echo "For the default region, use the region where you want to deploy the new "
echo "copy of the Serverless MFA API (such as us-east-1, us-east-2, us-west-1, "
echo "or us-west-2). The Default output format can be left blank."
aws configure
echo ""

echo ""
echo "--------------------- Preparing to download backups ---------------------"
echo ""

echo "What is the S3 bucket where those backups are stored? "
echo "EXAMPLE: sourceAWSaccount.backups.dynamodb.mfa-api"
read s3bucketToRestoreFrom
echo ""

aws s3 sync \
    --delete \
    --acl private \
    --sse AES256 \
    --profile "restore-s3-backups" \
    "s3://${s3bucketToRestoreFrom}" \
    "recovery/TempCopyOfBackups/"

echo ""
echo "------------- Installing serverless-mfa-api's dependencies --------------"
echo ""

npm i -g npm

npm ci

echo ""
echo "---------- Preparing to deploy new copy of serverless-mfa-api -----------"
echo ""

echo "What should we call the new instance of the Serverless MFA API? "
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

npm install gulp-cli -g

if [ ! -d "./recovery/DynamoDbBackUp" ]; then
  cd ./recovery

  curl --fail --location --remote-name https://github.com/silinternational/DynamoDbBackUp/archive/master.zip
  unzip master.zip
  rm master.zip
  mv DynamoDbBackUp-master DynamoDbBackUp

  cd DynamoDbBackUp

  npm install

  cd ../..
fi

echo ""
echo "------------- Preparing to upload backups to new S3 bucket --------------"
echo ""

echo "What name do you want to use for the new S3 Bucket where backups will be "
echo "stored? "
echo "EXAMPLE: targetAWSaccount.backups.dynamodb.${newServiceName}"
echo "(but replace targetAWSaccount with the name of the target AWS account)"
read newS3bucketName
echo ""

cd ./recovery/DynamoDbBackUp

gulp deploy-s3-bucket \
    --s3bucket "${newS3bucketName}" \
    --s3region "${targetRegion}"

echo "Waiting for the new S3 bucket to exist..."

aws s3api wait bucket-exists \
    --bucket "${newS3bucketName}"

aws s3api put-bucket-acl \
    --acl private \
    --bucket "${newS3bucketName}"

aws s3 sync \
    --delete \
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

for tableSuffix in $tableSuffixes; do
  echo "Loading ${tableSuffix} backup data into DynamoDB:"
  
  gulp restore \
      --s3bucket "${newS3bucketName}" \
      --s3prefix "${oldServiceName}_${stage}_${tableSuffix}" \
      --s3region "${targetRegion}" \
      --dbtable "${newServiceName}_${stage}_${tableSuffix}" \
      --dbregion "${targetRegion}" \
      --restoretime ${timestampWithMs}
done

cd ../..

echo ""
echo "------- Starting automated backups of this new Serverless MFA API -------"
echo ""

cd ./recovery/DynamoDbBackUp

for tableSuffix in $tableSuffixes; do
  echo "Starting automated backups of ${tableSuffix} from DynamoDB to S3:"
  
  gulp deploy-lambda \
      --s3bucket "${newS3bucketName}" \
      --s3prefix "${newServiceName}_${stage}_${tableSuffix}" \
      --s3region "${targetRegion}" \
      --dbregion "${targetRegion}" \
      --lName "backup_dynamodb_${newServiceName}_${stage}_${tableSuffix}" \
      --lRegion "${targetRegion}" \
      --lAlias active \
      --lRoleName LambdaBackupDynamoDBToS3 \
      --lTimeout 60
  
  gulp deploy-lambda-event \
      --dbtable "${newServiceName}_${stage}_${tableSuffix}" \
      --dbregion "${targetRegion}" \
      --lName "backup_dynamodb_${newServiceName}_${stage}_${tableSuffix}" \
      --lRegion "${targetRegion}" \
      --lAlias active
done

cd ../..

echo ""
echo "----- Doing full backup to ensure new S3 bucket items are encrypted -----"
echo ""

cd ./recovery/DynamoDbBackUp

for tableSuffix in $tableSuffixes; do
  echo "Doing full backup of ${tableSuffix} from DynamoDB to S3:"
  
  gulp backup-full \
      --s3bucket "${newS3bucketName}" \
      --s3prefix "${newServiceName}_${stage}_${tableSuffix}" \
      --s3region "${targetRegion}" \
      --dbtable "${newServiceName}_${stage}_${tableSuffix}" \
      --dbregion "${targetRegion}"
done

cd ../..

echo ""
echo "--------------- Removing temporary local copy of backups ----------------"
echo ""

rm -r recovery/TempCopyOfBackups/

echo ""
echo "--------------- Removing temporary remote copy of backups ---------------"
echo ""

for tableSuffix in $tableSuffixes; do
  echo "Removing temporary remote copy of original ${tableSuffix} backup data:"
  
  aws s3 rm "s3://${newS3bucketName}/${oldServiceName}_dev_${tableSuffix}/" \
      --recursive
  
  aws s3 rm "s3://${newS3bucketName}/${oldServiceName}_prod_${tableSuffix}/" \
      --recursive
done

echo ""
echo "---------------------- Finished setting up the new ----------------------"
echo "--------------- Serverless MFA API with data from backups ---------------"
echo ""
echo "   IMPORTANT!   "
echo ""
echo "You can now update your systems that need to use this, giving them the "
echo "new API Gateway URL. To find that... "
echo ""
echo "1. Sign in to the target AWS account. "
echo "2. Go to CloudFormation. "
echo "3. Find the ${newServiceName}-${stage} stack. "
echo "4. In its Outputs section, find the 'Service Endpoint' URL. "
echo "5. ADD A TRAILING SLASH and use that as the new value for the apiBaseUrl "
echo "   of any IdP that should use this new copy of the Serverless MFA API. "
echo "   (The apiKey and apiSecret will not have changed, since those were in "
echo "   the restored data.) "
echo ""
echo "   If using this with our IdP-in-a-Box, you will do so by updating the "
echo "   mfa_totp_apibaseurl and mfa_u2f_apibaseurl Terraform variables for "
echo "   the ID Broker workspace of the applicable IdP."
echo ""
echo "========================================================================="
echo ""
