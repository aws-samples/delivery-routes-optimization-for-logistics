#!/bin/bash
# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

if [[ "$OSTYPE" == "darwin"* ]]; then
    # for macos
    export JAVA_HOME=$(/usr/libexec/java_home)
fi

# build solution
./mvnw package

# package :: distancecache-util
mkdir -p build/distancecache-util
cp apps/distancecache-util/target/distance-cache-util-jar-with-dependencies.jar build/distancecache-util
cp scripts/Dockerfile.distancecache build/distancecache-util/Dockerfile

# package :: optimization engine
mkdir -p build/nextday-delivery
cp apps/nextday-delivery/target/delivery-dispatch-runner.jar build/nextday-delivery
cp apps/nextday-delivery/src/main/resources/solver-config.xml build/nextday-delivery
cp scripts/Dockerfile.nextdaydelivery build/nextday-delivery/Dockerfile