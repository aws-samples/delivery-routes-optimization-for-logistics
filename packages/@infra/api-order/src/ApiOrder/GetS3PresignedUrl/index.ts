/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { Construct } from 'constructs'
import * as core from 'aws-cdk-lib'
import { aws_lambda as lambda, aws_s3 as s3 } from 'aws-cdk-lib'
import { namespaced, common_lambda, common_iam } from '@infra/common'

interface Environment extends common_lambda.DeclaredLambdaEnvironment {
  BUCKET_NAME: string
}

interface Dependencies extends common_lambda.DeclaredLambdaDependencies {
  readonly bucket: s3.IBucket
  readonly lambdaUtilsLayer: lambda.ILayerVersion
}

type TDeclaredProps = common_lambda.DeclaredLambdaProps<Environment, Dependencies>

export class GetS3PresignedUrlLambda extends common_lambda.DeclaredLambdaFunction<Environment, Dependencies> {
  constructor(scope: Construct, id: string, props: common_lambda.ExposedDeclaredLambdaProps<Dependencies>) {
    const { bucket, lambdaUtilsLayer } = props.dependencies

    const declaredProps: TDeclaredProps = {
      functionName: namespaced(scope, 'OrderUploadPresignedUrl'),
      description: 'Order Upload Presigned url function',
      code: lambda.Code.fromAsset(
        common_lambda.getLambdaDistPath(__dirname, '@lambda/order-upload-s3-presigned-url.zip'),
      ),
      dependencies: props.dependencies,
      timeout: core.Duration.seconds(30),
      runtime: lambda.Runtime.NODEJS_16_X,
      layers: [lambdaUtilsLayer],
      environment: {
        BUCKET_NAME: bucket.bucketName,
      },
      initialPolicy: [common_iam.PolicyStatements.s3.readWriteBucket(bucket.bucketArn)],
    }

    super(scope, id, declaredProps)
  }
}
