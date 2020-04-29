#!/usr/bin/env bash

set -e

aws dynamodb scan \
  --table-name development_server_api-key \
  --endpoint-url http://localhost:8000 \
  --region localhost
