#!/bin/bash

# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

# Order Info
WAREHOUSE_CODE=95001200
ORDER_DATE=20230102
LOCAL_ORDER_FILE_CSV="data/sample_order.csv"

# Account info
PROFILE=route-opt
REGION=ap-northeast-2
ACCOUNT_ID=$(aws sts get-caller-identity --profile $PROFILE --region $REGION --output json | jq .Account --raw-output)

SSM_PARAM_API_ENDPOINT="/DevProto/Api/Order/Upload/Url"
SSM_PARAM_API_KEY="/DevProto/Api/Order/Upload/Key"
TEMP_AUTH_FILE="auth_presigned_url.json"

echo "----------------------------------------------"
echo "Push order csv file to S3 with pre-signed url"
echo "----------------------------------------------"
echo "> region : $REGION"
echo "> account : $ACCOUNT_ID"
echo ""
echo "- Warehouse : $WAREHOUSE_CODE"
echo "- OrderDate : $ORDER_DATE"
echo "- OrderFile : $LOCAL_ORDER_FILE_CSV"
echo ""

# Get Presigned URL
echo "    [1] Get pre-signed url with policy ..."

ENDPOINT_BASE=$(aws ssm get-parameter --profile $PROFILE --region $REGION --name $SSM_PARAM_API_ENDPOINT | jq --raw-output ".Parameter.Value")
ENDPOINT_PRESIGNED_URL="${ENDPOINT_BASE}api/order/upload/get-presigned-url"
APIKEY_PRESIGNED_URL=$(aws ssm get-parameter --profile $PROFILE --region $REGION --name $SSM_PARAM_API_KEY | jq --raw-output ".Parameter.Value")
REQ_PRESIGNED_URL="{\"operation\": \"putObject\", \"keyPath\": \"orders_${WAREHOUSE_CODE}_${ORDER_DATE}.csv\"}"

curl -s -X POST $ENDPOINT_PRESIGNED_URL \
     -H "Content-Type: application/json" \
     -H "\"x-api-key: ${APIKEY_PRESIGNED_URL}\"" \
     -d "$REQ_PRESIGNED_URL" | cat > $TEMP_AUTH_FILE

# Parse Credentials
echo "    [2] Uploading order file ..."

ENDPOINT_ORDER_UPLOAD=$(jq --raw-output ".url" ${TEMP_AUTH_FILE})
H_KEY=$(jq --raw-output ".fields.key" ${TEMP_AUTH_FILE})
H_BUCKET=$(jq --raw-output ".fields.bucket" ${TEMP_AUTH_FILE})
H_AMZ_ALG=$(jq --raw-output ".fields[\"X-Amz-Algorithm\"]" ${TEMP_AUTH_FILE})
H_AMZ_CRED=$(jq --raw-output ".fields[\"X-Amz-Credential\"]" ${TEMP_AUTH_FILE})
H_AMZ_DATE=$(jq --raw-output ".fields[\"X-Amz-Date\"]" ${TEMP_AUTH_FILE})
H_AMZ_TKN=$(jq --raw-output ".fields[\"X-Amz-Security-Token\"]" ${TEMP_AUTH_FILE})
H_POLICY=$(jq --raw-output ".fields.Policy" ${TEMP_AUTH_FILE})
H_AMZ_SIG=$(jq --raw-output ".fields[\"X-Amz-Signature\"]" ${TEMP_AUTH_FILE})
rm $TEMP_AUTH_FILE

curl -X POST $ENDPOINT_ORDER_UPLOAD \
     -H "Content-Type: multipart/form-data" \
     -F key=$H_KEY \
     -F bucket=$H_BUCKET \
     -F X-Amz-Algorithm=$H_AMZ_ALG \
     -F X-Amz-Credential=$H_AMZ_CRED \
     -F X-Amz-Date=$H_AMZ_DATE \
     -F X-Amz-Security-Token=$H_AMZ_TKN \
     -F Policy=$H_POLICY \
     -F X-Amz-Signature=$H_AMZ_SIG \
     -F file=@$LOCAL_ORDER_FILE_CSV 

echo ""
echo "Done"