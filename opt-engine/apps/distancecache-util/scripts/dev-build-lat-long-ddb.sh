#!/bin/sh
# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

PROFILE=route-opt
REGION=ap-northeast-2
WAREHOUSE_CODE=95001200

cd target
java -jar \
         -Dbuild.profile=dev \
         -Daws.profile=$PROFILE \
         -Daws.region=$REGION \
     distance-cache-util-jar-with-dependencies.jar build-lat-long \
         --location ddb \
         --warehouse $WAREHOUSE_CODE
cd ..