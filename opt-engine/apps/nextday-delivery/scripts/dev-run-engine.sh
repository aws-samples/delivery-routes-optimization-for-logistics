#!/bin/sh
# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

PROFILE=route-opt
REGION=ap-northeast-2

ORDER_DATE=20230101
WAREHOUSE_CODE=95001200

cd target
java -jar \
     -Dbuild.profile=dev \
     -Daws.profile=$PROFILE \
     -Daws.region=$REGION \
     -Dorder-date=$ORDER_DATE \
     -Dwarehouse-code=$WAREHOUSE_CODE \
     delivery-dispatch-runner.jar
cd ..
