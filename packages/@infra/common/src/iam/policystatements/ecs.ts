/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { aws_iam as iam } from 'aws-cdk-lib'

const ssmPolicyStatement = (actions: string[], resources: string[]): iam.PolicyStatement => {
  const policyStatement = new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    actions,
    resources,
  })

  return policyStatement
}

export const iamPassRole = (account: string): iam.PolicyStatement => {
  return ssmPolicyStatement(['iam:PassRole'], [`arn:aws:iam::${account}:role/*`])
}

export const ecsRunTask = (account: string): iam.PolicyStatement => {
  return ssmPolicyStatement(['ecs:RunTask'], [`arn:aws:ecs:*:${account}:task-definition/*:*`])
}
