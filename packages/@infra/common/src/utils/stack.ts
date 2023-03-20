/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import * as fs from 'fs'
import * as path from 'path'
import { Construct } from 'constructs'
import { Stack } from 'aws-cdk-lib'

export function getRootStack(scope: Construct): Stack {
  let rootStack = Stack.of(scope)

  while (rootStack.nestedStackParent) {
    rootStack = rootStack.nestedStackParent
  }

  return rootStack
}

export function validateStackParameterLimit(stack: Stack): void {
  const template = JSON.parse(fs.readFileSync(path.join(process.env.CDK_OUTDIR as string, stack.templateFile), 'utf-8'))
  const parameterCount = Object.keys(template.Parameters || {}).length

  if (parameterCount > 60) {
    throw new Error(`Stack "${stack.stackName}" exceeded limit of 60 parameters: ${parameterCount}`)
  }
}
