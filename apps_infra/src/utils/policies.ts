/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 *
 * Reusable IAM PolicyStatement builders for common AWS service access patterns.
 * Used by ECS task roles, Lambda roles, and other constructs that need
 * fine-grained access to SSM, S3, and DynamoDB resources.
 */
import { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam'

export const ddbReadActions = ['dynamodb:BatchGetItem', 'dynamodb:GetItem', 'dynamodb:Scan', 'dynamodb:Query']
export const ddbWriteActions = ['dynamodb:PutItem', 'dynamodb:UpdateItem', 'dynamodb:DeleteItem']
export const ddbBatchWriteActions = ['dynamodb:BatchWriteItem']

export const PolicyStatements = {
  /** SSM Parameter Store access */
  ssm: {
    readParams: (region: string, account: string) =>
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['ssm:GetParameter', 'ssm:GetParameters', 'ssm:GetParametersByPath'],
        resources: [`arn:aws:ssm:${region}:${account}:parameter/*`],
      }),
  },
  /** S3 bucket access */
  s3: {
    readBucket: (arn: string) =>
      new PolicyStatement({
        actions: ['s3:GetObject', 's3:ListBucket'],
        resources: [arn, `${arn}/*`],
      }),
    writeBucket: (arn: string) =>
      new PolicyStatement({
        actions: ['s3:PutObject', 's3:ListBucket', 's3:GetObject'],
        resources: [arn, `${arn}/*`],
      }),
  },
  /** DynamoDB table access (includes index/* for GSI queries) */
  ddb: {
    readDDBTable: (arn: string) =>
      new PolicyStatement({
        actions: ddbReadActions,
        resources: [arn, `${arn}/index/*`],
      }),
    updateDDBTable: (arn: string) =>
      new PolicyStatement({
        actions: ddbWriteActions,
        resources: [arn],
      }),
    batchWriteDDBTable: (arn: string) =>
      new PolicyStatement({
        actions: ddbBatchWriteActions,
        resources: [arn],
      }),
  },
}
