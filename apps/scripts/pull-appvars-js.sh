#!/bin/bash

# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

NAMESPACE=devproto
PROFILE=route-opt
REGION=ap-northeast-2
ACCOUNT_ID=$(aws sts get-caller-identity --profile $PROFILE --region $REGION --output json | jq .Account --raw-output)

BUCKET=$NAMESPACE-website-$ACCOUNT_ID-$REGION
mkdir -p ../website/public/static

echo "Fetching s3://${BUCKET}/static/appvars.js"
aws s3 cp s3://${BUCKET}/static/appvars.js ../website/public/static/ --profile $PROFILE --region $REGION