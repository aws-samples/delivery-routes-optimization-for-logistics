/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import * as s3Statements from './s3'
import * as ddbStatements from './ddb'
import * as ssmParams from './ssm'
import * as ecsParams from './ecs'
import * as lambdaParams from './lambda'

export const ddb = { ...ddbStatements }
export const s3 = { ...s3Statements }
export const ssm = { ...ssmParams }
export const ecs = { ...ecsParams }
export const lambda = { ...lambdaParams }
