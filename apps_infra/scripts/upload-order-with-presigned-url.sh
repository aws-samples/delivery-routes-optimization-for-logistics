#!/bin/bash

# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

set -euo pipefail

# Order Info
WAREHOUSE_CODE=95001200
ORDER_DATE=20230102
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOCAL_ORDER_FILE_CSV="${SCRIPT_DIR}/data/sample_order.csv"

# Account info (reads from env or defaults)
PROFILE=${AWS_PROFILE:-}
REGION=${AWS_REGION:-us-east-1}

PROFILE_OPT=""
if [ -n "$PROFILE" ]; then
  PROFILE_OPT="--profile $PROFILE"
fi

ACCOUNT_ID=$(aws sts get-caller-identity $PROFILE_OPT --region $REGION --output json | jq .Account --raw-output)

# SSM parameter paths (matches config/default.yml parameterStoreKeys)
SSM_PARAM_API_ENDPOINT="/DevProto/Api/Order/Upload/Url"
SSM_PARAM_API_KEY="/DevProto/Api/Order/Upload/Key"

echo "----------------------------------------------"
echo "Push order csv file to S3 with pre-signed url"
echo "----------------------------------------------"
echo "> region  : $REGION"
echo "> account : $ACCOUNT_ID"
echo ""
echo "- Warehouse : $WAREHOUSE_CODE"
echo "- OrderDate : $ORDER_DATE"
echo "- OrderFile : $LOCAL_ORDER_FILE_CSV"
echo ""

# Get API endpoint and key
echo "    [1] Get pre-signed url ..."

ENDPOINT_BASE=$(aws ssm get-parameter $PROFILE_OPT --region $REGION --name $SSM_PARAM_API_ENDPOINT | jq --raw-output ".Parameter.Value")
ENDPOINT_PRESIGNED_URL="${ENDPOINT_BASE}upload/url"
API_KEY_ID=$(aws ssm get-parameter $PROFILE_OPT --region $REGION --name $SSM_PARAM_API_KEY | jq --raw-output ".Parameter.Value")
API_KEY_VALUE=$(aws apigateway get-api-key $PROFILE_OPT --region $REGION --api-key "$API_KEY_ID" --include-value | jq --raw-output ".value")

# Request presigned URL from Lambda
PRESIGNED_RESPONSE=$(curl -s -X GET "$ENDPOINT_PRESIGNED_URL" \
     -H "x-api-key: ${API_KEY_VALUE}")

UPLOAD_URL=$(echo "$PRESIGNED_RESPONSE" | jq --raw-output ".url")

if [ "$UPLOAD_URL" = "null" ] || [ -z "$UPLOAD_URL" ]; then
  echo "ERROR: Failed to get presigned URL"
  echo "Response: $PRESIGNED_RESPONSE"
  exit 1
fi

# Upload file using PUT presigned URL
echo "    [2] Uploading order file ..."

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$UPLOAD_URL" \
     -H "Content-Type: application/json" \
     --data-binary "@$LOCAL_ORDER_FILE_CSV")

if [ "$HTTP_STATUS" -eq 200 ]; then
  echo "    Upload successful (HTTP $HTTP_STATUS)"
else
  echo "    ERROR: Upload failed (HTTP $HTTP_STATUS)"
  exit 1
fi

echo ""
echo "Done."
