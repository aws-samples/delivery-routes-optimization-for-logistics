#!/bin/bash

# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

set -euo pipefail

# Configuration (matches config/default.yml namespace)
NAMESPACE=${NAMESPACE:-devproto}

# Account info (reads from env or defaults)
PROFILE=${AWS_PROFILE:-}
REGION=${AWS_REGION:-us-east-1}

PROFILE_OPT=""
if [ -n "$PROFILE" ]; then
  PROFILE_OPT="--profile $PROFILE"
fi

ACCOUNT_ID=$(aws sts get-caller-identity $PROFILE_OPT --region $REGION --output json | jq .Account --raw-output)

BUCKET="${NAMESPACE}-website-${ACCOUNT_ID}-${REGION}"

# Output directory (relative to project root)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_DIR="${SCRIPT_DIR}/../apps_web/public/static"
mkdir -p "$OUTPUT_DIR"

echo "Fetching s3://${BUCKET}/static/appvars.js"
aws s3 cp "s3://${BUCKET}/static/appvars.js" "$OUTPUT_DIR/" $PROFILE_OPT --region $REGION

echo "Done. File saved to: ${OUTPUT_DIR}/appvars.js"
