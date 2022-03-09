#!/usr/bin/env bash

set -e

set -x

aws dynamodb create-table \
  --table-name development_server_api-key \
  --attribute-definitions AttributeName=value,AttributeType=S \
  --key-schema AttributeName=value,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --endpoint-url http://localhost:8000 \
  --region localhost

aws dynamodb create-table \
  --table-name development_server_totp \
  --attribute-definitions AttributeName=uuid,AttributeType=S \
  --key-schema AttributeName=uuid,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --endpoint-url http://localhost:8000 \
  --region localhost

aws dynamodb create-table \
  --table-name development_server_u2f \
  --attribute-definitions AttributeName=uuid,AttributeType=S \
  --key-schema AttributeName=uuid,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --endpoint-url http://localhost:8000 \
  --region localhost
