/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { Construct } from 'constructs'
import * as core from 'aws-cdk-lib'
import { aws_s3 as s3, aws_dynamodb as ddb, aws_ssm as ssm } from 'aws-cdk-lib'
import { sync as findUp } from 'find-up'
import * as path from 'path'
import { setNamespace } from '@infra/common'
import { ApiOrder } from '@infra/api-order'

export interface OrderUploadStackProps extends core.StackProps {
  readonly namespace: string
  readonly parameterStoreKeys: Record<string, string>
}

/**
 * OrderUploadStack
 */
export class OrderUploadStack extends core.Stack {
  constructor(scope: Construct, id: string, props: OrderUploadStackProps) {
    super(scope, id, props)

    const { namespace, parameterStoreKeys } = props

    setNamespace(this, namespace)

    const tablename = ssm.StringParameter.valueForStringParameter(this, parameterStoreKeys.ordersTableName)
    const orders = ddb.Table.fromTableName(this, 'order-upload-table', tablename)
    const region = this.region
    const account = this.account

    const orderApi = new ApiOrder(this, 'ApiOrder', {
      region,
      account,
      orders,
      parameterStoreKeys,
    })
  }
}
