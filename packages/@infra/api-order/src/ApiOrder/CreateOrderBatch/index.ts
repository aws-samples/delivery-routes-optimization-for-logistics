/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { Construct } from 'constructs'
import * as core from 'aws-cdk-lib'
import { aws_lambda as lambda, aws_s3 as s3, aws_dynamodb as ddb } from 'aws-cdk-lib'
import { namespaced, common_lambda, common_iam } from '@infra/common'

interface Environment extends common_lambda.DeclaredLambdaEnvironment {
  BUCKET_NAME: string
  TABLE_NAME: string
  ORDER_DISPATCH_LAMBDA_NAME: string
}

interface Dependencies extends common_lambda.DeclaredLambdaDependencies {
  readonly account: string
  readonly bucket: s3.IBucket
  readonly table: ddb.ITable
  readonly orderDispatchLambdaName: string
  readonly lambdaUtilsLayer: lambda.ILayerVersion
}

type TDeclaredProps = common_lambda.DeclaredLambdaProps<Environment, Dependencies>

export class CreateOrderBatchLambda extends common_lambda.DeclaredLambdaFunction<Environment, Dependencies> {
  constructor(scope: Construct, id: string, props: common_lambda.ExposedDeclaredLambdaProps<Dependencies>) {
    const { account, bucket, table, orderDispatchLambdaName, lambdaUtilsLayer } = props.dependencies

    const declaredProps: TDeclaredProps = {
      functionName: namespaced(scope, 'CreateOrderBatch'),
      description: 'Create Order Batch function',
      code: lambda.Code.fromAsset(common_lambda.getLambdaDistPath(__dirname, '@lambda/order-create-batch.zip')),
      dependencies: props.dependencies,
      timeout: core.Duration.seconds(60),
      runtime: lambda.Runtime.NODEJS_16_X,
      layers: [lambdaUtilsLayer],
      environment: {
        BUCKET_NAME: bucket.bucketName,
        TABLE_NAME: table.tableName,
        ORDER_DISPATCH_LAMBDA_NAME: orderDispatchLambdaName,
      },
      initialPolicy: [
        common_iam.PolicyStatements.s3.readBucket(bucket.bucketArn),
        common_iam.PolicyStatements.ddb.batchWriteDDBTable(table.tableArn),
        common_iam.PolicyStatements.lambda.invokeFunction(account),
      ],
    }

    super(scope, id, declaredProps)
  }
}
