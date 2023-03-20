/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { aws_iam as iam } from 'aws-cdk-lib'
import { S3 } from 'cdk-iam-actions/lib/actions'

const bucketPolicyStatement = (actions: string[], bucketArn: string): iam.PolicyStatement => {
  const policyStatement = new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    actions,
    resources: [bucketArn, `${bucketArn}/*`],
  })

  return policyStatement
}

export const readBucket = (bucketArn: string): iam.PolicyStatement => {
  return bucketPolicyStatement([S3.GET_OBJECT, S3.HEAD_BUCKET, S3.LIST_BUCKET], bucketArn)
}

export const writeBucket = (bucketArn: string): iam.PolicyStatement => {
  return bucketPolicyStatement([S3.PUT_OBJECT, S3.PUT_OBJECT_ACL], bucketArn)
}

export const readWriteBucket = (bucketArn: string): iam.PolicyStatement => {
  return bucketPolicyStatement(
    [S3.GET_OBJECT, S3.HEAD_BUCKET, S3.LIST_BUCKET, S3.PUT_OBJECT, S3.PUT_OBJECT_ACL],
    bucketArn,
  )
}

export const deleteObjectBucket = (bucketArn: string): iam.PolicyStatement => {
  return bucketPolicyStatement([S3.DELETE_OBJECT], bucketArn)
}
