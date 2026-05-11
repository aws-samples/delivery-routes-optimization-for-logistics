#!/bin/bash

# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

set -euo pipefail

# Account info (reads from env or defaults)
PROFILE=${AWS_PROFILE:-}
REGION=${AWS_REGION:-us-east-1}

PROFILE_OPT=""
if [ -n "$PROFILE" ]; then
  PROFILE_OPT="--profile $PROFILE"
fi

DOMAIN=$(aws cloudformation list-exports $PROFILE_OPT --region $REGION --query "Exports[?Name=='WebHostingDomain'].Value" --output text)
WEBURL="https://${DOMAIN}"
echo "Demo URL : ${WEBURL}"

# Open in browser (macOS: open, Linux: xdg-open)
if command -v open &> /dev/null; then
  open "$WEBURL" &
elif command -v xdg-open &> /dev/null; then
  xdg-open "$WEBURL" &
else
  echo "Please open the URL manually in your browser."
fi
