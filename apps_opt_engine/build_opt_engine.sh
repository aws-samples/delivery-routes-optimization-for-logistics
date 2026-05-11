#!/bin/bash
# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0
set -e

# --- JDK 21 resolution ---------------------------------------------------------
# macOS: auto-detect via /usr/libexec/java_home.
# Linux / CI: expect JAVA_HOME to be exported, or a `java` binary on PATH that
#             reports major version 21.
if [[ "$OSTYPE" == "darwin"* ]]; then
    export JAVA_HOME=$(/usr/libexec/java_home -v 21)
elif [[ -z "${JAVA_HOME:-}" ]]; then
    # Attempt to derive JAVA_HOME from `java` on PATH
    if command -v java >/dev/null 2>&1; then
        JAVA_BIN="$(command -v java)"
        # Resolve symlinks (readlink on macOS vs realpath on Linux)
        if command -v realpath >/dev/null 2>&1; then
            JAVA_BIN="$(realpath "$JAVA_BIN")"
        fi
        export JAVA_HOME="$(dirname "$(dirname "$JAVA_BIN")")"
        echo "JAVA_HOME not set; derived JAVA_HOME=$JAVA_HOME from $(command -v java)"
    else
        echo "ERROR: JAVA_HOME is not set and no 'java' binary on PATH." >&2
        echo "       Install JDK 21 (Amazon Corretto 21 / Temurin 21) and export JAVA_HOME." >&2
        echo "       Example: export JAVA_HOME=/usr/lib/jvm/java-21-openjdk" >&2
        exit 1
    fi
fi

# Sanity-check JDK major version (must be 21)
JAVA_VERSION_OUT="$("$JAVA_HOME/bin/java" -version 2>&1 | head -1)"
JAVA_MAJOR="$(echo "$JAVA_VERSION_OUT" | sed -E 's/.*"([0-9]+)(\..*)?".*/\1/')"
if [[ "$JAVA_MAJOR" != "21" ]]; then
    echo "ERROR: JDK 21 is required but JAVA_HOME points to: $JAVA_VERSION_OUT" >&2
    echo "       JAVA_HOME=$JAVA_HOME" >&2
    exit 1
fi
echo "Using JAVA_HOME=$JAVA_HOME ($JAVA_VERSION_OUT)"
# -------------------------------------------------------------------------------

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

OSM_SRC="${OSM_FILE:-$HOME/.graphhopper/openstreetmap/south-korea-latest.osm.pbf}"
OSM_URL="${OSM_URL:-https://download.geofabrik.de/asia/south-korea-latest.osm.pbf}"

# Download OSM file from Geofabrik if it does not exist locally.
# If OSM_SRC already exists, it is reused as-is (no re-download).
ensure_osm_file() {
    if [[ -f "$OSM_SRC" ]]; then
        echo "OSM file found at $OSM_SRC -- skipping download."
        return 0
    fi

    echo "OSM file not found at $OSM_SRC -- downloading from $OSM_URL"
    local osm_dir
    osm_dir="$(dirname "$OSM_SRC")"
    mkdir -p "$osm_dir"

    local tmp_file="${OSM_SRC}.download"
    # Clean up partial download on failure so next run retries cleanly.
    trap 'rm -f "$tmp_file"' ERR

    if command -v curl >/dev/null 2>&1; then
        curl -fL --retry 3 --retry-delay 5 -o "$tmp_file" "$OSM_URL"
    elif command -v wget >/dev/null 2>&1; then
        wget --tries=3 -O "$tmp_file" "$OSM_URL"
    else
        echo "ERROR: neither 'curl' nor 'wget' is available. Install one or download $OSM_URL manually to $OSM_SRC" >&2
        rm -f "$tmp_file"
        return 1
    fi

    mv "$tmp_file" "$OSM_SRC"
    trap - ERR
    echo "OSM file downloaded to $OSM_SRC"
}

ensure_osm_file

# Build
./gradlew clean :apps:nextday-delivery:bootJar :apps:distancecache-util:shadowJar

# Package :: distancecache-util
mkdir -p build/distancecache-util
cp apps/distancecache-util/build/libs/distance-cache-util.jar build/distancecache-util/
cp scripts/Dockerfile.distancecache build/distancecache-util/Dockerfile
cp "$OSM_SRC" build/distancecache-util/mapfile.osm.pbf
echo "OSM file bundled into build/distancecache-util/mapfile.osm.pbf"

# Package :: optimization engine
mkdir -p build/nextday-delivery
cp apps/nextday-delivery/build/libs/delivery-dispatch.jar build/nextday-delivery/
cp apps/nextday-delivery/src/main/resources/solver-config.xml build/nextday-delivery/
cp scripts/Dockerfile.nextdaydelivery build/nextday-delivery/Dockerfile
cp "$OSM_SRC" build/nextday-delivery/south-korea-latest.osm.pbf
echo "OSM file bundled into build/nextday-delivery/south-korea-latest.osm.pbf"
