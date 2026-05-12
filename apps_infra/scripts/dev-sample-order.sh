#!/bin/bash

# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

set -euo pipefail

# Data Config
WAREHOUSE_CODE=95001200
ORDER_DATE=20230101

# Account info (reads from env or defaults)
PROFILE=${AWS_PROFILE:-}
REGION=${AWS_REGION:-us-east-1}

PROFILE_OPT=""
if [ -n "$PROFILE" ]; then
  PROFILE_OPT="--profile $PROFILE"
fi

ACCOUNT_ID=$(aws sts get-caller-identity $PROFILE_OPT --region $REGION --output json | jq .Account --raw-output)

# DynamoDB table name from SSM (matches config/default.yml parameterStoreKeys.ordersTableName)
DDB_ORDER=$(aws ssm get-parameter $PROFILE_OPT --region $REGION --name /DevProto/Ddb/Orders/TableName | jq --raw-output ".Parameter.Value")

# Upload Sample Order for Dev
echo "-----------------------------"
echo "Upload sample order data"
echo "-----------------------------"
echo "> region  : $REGION"
echo "> account : $ACCOUNT_ID"
echo ""
echo "- WAREHOUSE_CODE : $WAREHOUSE_CODE"
echo "- ORDER_DATE     : $ORDER_DATE"
echo ""

echo "  Uploading ..."
aws dynamodb put-item $PROFILE_OPT --region $REGION --table-name $DDB_ORDER --item '{"Id":{"S":"next-day-dev-sample-order-1"},"orderNo":{"S":"001"},"warehouseCode":{"S":"'$WAREHOUSE_CODE'"},"orderDate":{"S":"'$ORDER_DATE'"},"deliveryCode":{"S":"10000010"},"deliveryName":{"S":"E1 Hospital"},"sumWeight":{"N":"5500"}}'
aws dynamodb put-item $PROFILE_OPT --region $REGION --table-name $DDB_ORDER --item '{"Id":{"S":"next-day-dev-sample-order-2"},"orderNo":{"S":"002"},"warehouseCode":{"S":"'$WAREHOUSE_CODE'"},"orderDate":{"S":"'$ORDER_DATE'"},"deliveryCode":{"S":"10001200"},"deliveryName":{"S":"H Hospital"},"sumWeight":{"N":"1100"}}'
aws dynamodb put-item $PROFILE_OPT --region $REGION --table-name $DDB_ORDER --item '{"Id":{"S":"next-day-dev-sample-order-3"},"orderNo":{"S":"003"},"warehouseCode":{"S":"'$WAREHOUSE_CODE'"},"orderDate":{"S":"'$ORDER_DATE'"},"deliveryCode":{"S":"10002561"},"deliveryName":{"S":"MM Hospital"},"sumWeight":{"N":"500"}}'
aws dynamodb put-item $PROFILE_OPT --region $REGION --table-name $DDB_ORDER --item '{"Id":{"S":"next-day-dev-sample-order-4"},"orderNo":{"S":"004"},"warehouseCode":{"S":"'$WAREHOUSE_CODE'"},"orderDate":{"S":"'$ORDER_DATE'"},"deliveryCode":{"S":"10002566"},"deliveryName":{"S":"B Hospital"},"sumWeight":{"N":"700"}}'
aws dynamodb put-item $PROFILE_OPT --region $REGION --table-name $DDB_ORDER --item '{"Id":{"S":"next-day-dev-sample-order-5"},"orderNo":{"S":"101"},"warehouseCode":{"S":"'$WAREHOUSE_CODE'"},"orderDate":{"S":"'$ORDER_DATE'"},"deliveryCode":{"S":"10000020"},"deliveryName":{"S":"YS Hospital"},"sumWeight":{"N":"3500"}}'
aws dynamodb put-item $PROFILE_OPT --region $REGION --table-name $DDB_ORDER --item '{"Id":{"S":"next-day-dev-sample-order-6"},"orderNo":{"S":"102"},"warehouseCode":{"S":"'$WAREHOUSE_CODE'"},"orderDate":{"S":"'$ORDER_DATE'"},"deliveryCode":{"S":"10002622"},"deliveryName":{"S":"YW Clinic"},"sumWeight":{"N":"1000"}}'
aws dynamodb put-item $PROFILE_OPT --region $REGION --table-name $DDB_ORDER --item '{"Id":{"S":"next-day-dev-sample-order-7"},"orderNo":{"S":"101a"},"warehouseCode":{"S":"'$WAREHOUSE_CODE'"},"orderDate":{"S":"'$ORDER_DATE'"},"deliveryCode":{"S":"10000020"},"deliveryName":{"S":"YS Hospital"},"sumWeight":{"N":"2500"}}'
aws dynamodb put-item $PROFILE_OPT --region $REGION --table-name $DDB_ORDER --item '{"Id":{"S":"next-day-dev-sample-order-8"},"orderNo":{"S":"104"},"warehouseCode":{"S":"'$WAREHOUSE_CODE'"},"orderDate":{"S":"'$ORDER_DATE'"},"deliveryCode":{"S":"10002685"},"deliveryName":{"S":"ME Hospital"},"sumWeight":{"N":"2500"}}'
aws dynamodb put-item $PROFILE_OPT --region $REGION --table-name $DDB_ORDER --item '{"Id":{"S":"next-day-dev-sample-order-9"},"orderNo":{"S":"105"},"warehouseCode":{"S":"'$WAREHOUSE_CODE'"},"orderDate":{"S":"'$ORDER_DATE'"},"deliveryCode":{"S":"10002755"},"deliveryName":{"S":"YY Clinic"},"sumWeight":{"N":"2200"}}'
aws dynamodb put-item $PROFILE_OPT --region $REGION --table-name $DDB_ORDER --item '{"Id":{"S":"next-day-dev-sample-order-10"},"orderNo":{"S":"105a"},"warehouseCode":{"S":"'$WAREHOUSE_CODE'"},"orderDate":{"S":"'$ORDER_DATE'"},"deliveryCode":{"S":"10002755"},"deliveryName":{"S":"YY Clinic"},"sumWeight":{"N":"1300"}}'
aws dynamodb put-item $PROFILE_OPT --region $REGION --table-name $DDB_ORDER --item '{"Id":{"S":"next-day-dev-sample-order-11"},"orderNo":{"S":"105b"},"warehouseCode":{"S":"'$WAREHOUSE_CODE'"},"orderDate":{"S":"'$ORDER_DATE'"},"deliveryCode":{"S":"10002755"},"deliveryName":{"S":"YY Clinic"},"sumWeight":{"N":"790"}}'
aws dynamodb put-item $PROFILE_OPT --region $REGION --table-name $DDB_ORDER --item '{"Id":{"S":"next-day-dev-sample-order-12"},"orderNo":{"S":"101b"},"warehouseCode":{"S":"'$WAREHOUSE_CODE'"},"orderDate":{"S":"'$ORDER_DATE'"},"deliveryCode":{"S":"10000020"},"deliveryName":{"S":"YS Hospital"},"sumWeight":{"N":"2800"}}'
aws dynamodb put-item $PROFILE_OPT --region $REGION --table-name $DDB_ORDER --item '{"Id":{"S":"next-day-dev-sample-order-13"},"orderNo":{"S":"107"},"warehouseCode":{"S":"'$WAREHOUSE_CODE'"},"orderDate":{"S":"'$ORDER_DATE'"},"deliveryCode":{"S":"10002057"},"deliveryName":{"S":"S Hospital"},"sumWeight":{"N":"4000"}}'
aws dynamodb put-item $PROFILE_OPT --region $REGION --table-name $DDB_ORDER --item '{"Id":{"S":"next-day-dev-sample-order-14"},"orderNo":{"S":"107a"},"warehouseCode":{"S":"'$WAREHOUSE_CODE'"},"orderDate":{"S":"'$ORDER_DATE'"},"deliveryCode":{"S":"10002057"},"deliveryName":{"S":"S Hospital"},"sumWeight":{"N":"33000"}}'
aws dynamodb put-item $PROFILE_OPT --region $REGION --table-name $DDB_ORDER --item '{"Id":{"S":"next-day-dev-sample-order-15"},"orderNo":{"S":"201"},"warehouseCode":{"S":"'$WAREHOUSE_CODE'"},"orderDate":{"S":"'$ORDER_DATE'"},"deliveryCode":{"S":"10000030"},"deliveryName":{"S":"E2 Hospital"},"sumWeight":{"N":"4000"}}'
aws dynamodb put-item $PROFILE_OPT --region $REGION --table-name $DDB_ORDER --item '{"Id":{"S":"next-day-dev-sample-order-16"},"orderNo":{"S":"202"},"warehouseCode":{"S":"'$WAREHOUSE_CODE'"},"orderDate":{"S":"'$ORDER_DATE'"},"deliveryCode":{"S":"10000568"},"deliveryName":{"S":"MH Hospital"},"sumWeight":{"N":"2000"}}'
aws dynamodb put-item $PROFILE_OPT --region $REGION --table-name $DDB_ORDER --item '{"Id":{"S":"next-day-dev-sample-order-17"},"orderNo":{"S":"203"},"warehouseCode":{"S":"'$WAREHOUSE_CODE'"},"orderDate":{"S":"'$ORDER_DATE'"},"deliveryCode":{"S":"10000724"},"deliveryName":{"S":"HH Hospital"},"sumWeight":{"N":"950"}}'

echo ""
echo "Done."
