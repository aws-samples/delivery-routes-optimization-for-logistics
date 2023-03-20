/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { aws_iam as iam } from 'aws-cdk-lib'
import { SSM } from 'cdk-iam-actions/lib/actions'

const ssmPolicyStatement = (actions: string[], resources: string[]): iam.PolicyStatement => {
  const policyStatement = new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    actions,
    resources,
  })

  return policyStatement
}

export const readSSMParams = (region: string, account: string): iam.PolicyStatement => {
  return ssmPolicyStatement(
    ['ssm:Describe*', 'ssm:Get*', 'ssm:List*'],
    [`arn:aws:ssm:${region}:${account}:parameter/*`],
  )
}
