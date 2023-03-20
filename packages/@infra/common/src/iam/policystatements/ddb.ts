/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { aws_iam as iam } from 'aws-cdk-lib'
import { DynamoDB } from 'cdk-iam-actions/lib/actions'

const tablePolicyStatement = (actions: string[], tableArn: string): iam.PolicyStatement => {
  const policyStatement = new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    actions,
    resources: [tableArn],
  })

  return policyStatement
}

export const readDDBTable = (tableArn: string): iam.PolicyStatement => {
  return tablePolicyStatement(
    [DynamoDB.GET_ITEM, DynamoDB.BATCH_GET_ITEM, DynamoDB.GET_RECORDS, DynamoDB.SCAN, DynamoDB.QUERY],
    tableArn,
  )
}

export const updateDDBTable = (tableArn: string): iam.PolicyStatement => {
  return tablePolicyStatement([DynamoDB.UPDATE_ITEM, DynamoDB.PUT_ITEM], tableArn)
}

export const batchWriteDDBTable = (tableArn: string): iam.PolicyStatement => {
  return tablePolicyStatement([DynamoDB.UPDATE_ITEM, DynamoDB.PUT_ITEM, DynamoDB.BATCH_WRITE_ITEM], tableArn)
}

export const deleteFromDDBTable = (tableArn: string): iam.PolicyStatement => {
  return tablePolicyStatement([DynamoDB.DELETE_ITEM], tableArn)
}
