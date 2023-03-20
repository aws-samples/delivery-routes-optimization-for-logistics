/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { Construct } from 'constructs'
import * as core from 'aws-cdk-lib'
import { aws_lambda as lambda, aws_s3 as s3, aws_dynamodb as ddb } from 'aws-cdk-lib'
import { namespaced, common_lambda, common_iam } from '@infra/common'

interface Environment extends common_lambda.DeclaredLambdaEnvironment {
  KEY_CLUSTER: string
  KEY_CAPACITY_PROVIDER: string
  KEY_TASK_DEF: string
  KEY_CONTAINER: string
}

interface Dependencies extends common_lambda.DeclaredLambdaDependencies {
  readonly keyCluster: string
  readonly keyCapacityProvider: string
  readonly keyTaskDef: string
  readonly keyContainer: string
  readonly region: string
  readonly account: string
  readonly lambdaUtilsLayer: lambda.ILayerVersion
}

type TDeclaredProps = common_lambda.DeclaredLambdaProps<Environment, Dependencies>

export class StartOrderDispatchTaskLambda extends common_lambda.DeclaredLambdaFunction<Environment, Dependencies> {
  constructor(scope: Construct, id: string, props: common_lambda.ExposedDeclaredLambdaProps<Dependencies>) {
    const { keyCluster, keyCapacityProvider, keyTaskDef, keyContainer, region, account, lambdaUtilsLayer } =
      props.dependencies

    const declaredProps: TDeclaredProps = {
      functionName: namespaced(scope, 'StartOrderDispatchTask'),
      description: 'Start Order Job',
      code: lambda.Code.fromAsset(common_lambda.getLambdaDistPath(__dirname, '@lambda/start-order-dispatch.zip')),
      dependencies: props.dependencies,
      timeout: core.Duration.seconds(30),
      runtime: lambda.Runtime.NODEJS_16_X,
      layers: [lambdaUtilsLayer],
      environment: {
        KEY_CLUSTER: keyCluster,
        KEY_CAPACITY_PROVIDER: keyCapacityProvider,
        KEY_TASK_DEF: keyTaskDef,
        KEY_CONTAINER: keyContainer,
      },
      initialPolicy: [
        common_iam.PolicyStatements.ssm.readSSMParams(region, account),
        common_iam.PolicyStatements.ecs.iamPassRole(account),
        common_iam.PolicyStatements.ecs.ecsRunTask(account),
      ],
    }

    super(scope, id, declaredProps)
  }
}
