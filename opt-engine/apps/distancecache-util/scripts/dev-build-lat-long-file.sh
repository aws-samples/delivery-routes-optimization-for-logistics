#!/bin/sh
# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

PROFILE=routeopt
REGION=ap-northeast-2

cd target
java -jar \
    -Dbuild.profile=dev \
    -Daws.profile=$PROFILE \
    -Daws.region=$REGION \
     distance-cache-util-jar-with-dependencies.jar \
     build-lat-long --location file --location-file $1
cd ..