#!/bin/sh
# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

set -e

export DEPLOYMENT_PROFILE=your-aws-peofile
export DEPLOYMENT_REGION=ap-northeast-2
export DEPLOYMENT_NAMESPACE=devproto

printf "================================================================================\n"
printf "[Notice] Destroy All infrastructore of Nextday Delivery Optimization Application\n"
printf "================================================================================\n"
printf "All infrastructure will be destroied!!\n"
printf "\n"
read -p "Are you sure (YyNn)? " -n 1 -r
[[ $REPLY =~ ^[Yy]$ ]] || exit 0
printf "\n"

pushd infra
yarn dev:DESTROY:all --profile "${DEPLOYMENT_PROFILE}" --region "${DEPLOYMENT_REGION}"
popd

printf "\n"
printf "\nCDK destroy done."
printf "\n"