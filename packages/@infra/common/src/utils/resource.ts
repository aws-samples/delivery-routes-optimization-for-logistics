/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { Construct } from 'constructs'
import { CfnResource, RemovalPolicy } from 'aws-cdk-lib'

export function retainResource(construct: Construct): void {
  if (construct instanceof CfnResource && (construct as CfnResource)?.applyRemovalPolicy) {
    ;(construct as CfnResource)?.applyRemovalPolicy(RemovalPolicy.RETAIN)
  } else {
    ;(construct.node.findChild('Resource') as CfnResource)?.applyRemovalPolicy(RemovalPolicy.RETAIN)
  }
}
