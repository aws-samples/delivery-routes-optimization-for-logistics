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

export const invokeFunction = (account: string): iam.PolicyStatement => {
  return ssmPolicyStatement(['lambda:InvokeFunction', 'lambda:InvokeAsync'], [`arn:aws:lambda:*:${account}:function:*`])
}
