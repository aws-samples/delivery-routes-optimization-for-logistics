#!/bin/bash

# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

# Account info
PROFILE=route-opt
REGION=ap-northeast-2

DOMAIN=$(aws cloudformation list-exports --profile route-opt --query "Exports[?Name=='WebHostingDomain'].Value" --output text)
WEBURL="https://${DOMAIN}"
echo "Demo URL : ${WEBURL}"

open $WEBURL &