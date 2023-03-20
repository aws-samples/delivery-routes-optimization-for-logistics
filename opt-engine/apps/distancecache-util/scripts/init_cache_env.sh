#!/bin/sh
# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

# Install java 17
sudo yum install -y java-17-amazon-corretto

# Cache output dir
mkdir -p ~/.graphhopper/graphhopper

# Map dir
mkdir -p ~/.graphhopper/openstreetmap

# Download map file
pushd ~/.graphhopper/openstreetmap
wget https://download.geofabrik.de/asia/south-korea-latest.osm.pbf
cp south-korea-latest.osm.pbf mapfile.osm.pbf
popd
