/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { Construct } from 'constructs'
import * as core from 'aws-cdk-lib'
import { aws_dynamodb as ddb, aws_lambda as lambda } from 'aws-cdk-lib'
import { namespaced, common_lambda, common_iam } from '@infra/common'

interface Environment extends common_lambda.DeclaredLambdaEnvironment {
  DDB_TABLE: string
  MANAGER_NAME: string
}

interface Dependencies extends common_lambda.DeclaredLambdaDependencies {
  readonly deliveryJobs: ddb.ITable
  readonly lambdaUtilsLayer: lambda.ILayerVersion
}

type TDeclaredProps = common_lambda.DeclaredLambdaProps<Environment, Dependencies>

export class DeliveryJobSolverJobQueryLambda extends common_lambda.DeclaredLambdaFunction<Environment, Dependencies> {
  constructor(scope: Construct, id: string, props: common_lambda.ExposedDeclaredLambdaProps<Dependencies>) {
    const { deliveryJobs, lambdaUtilsLayer } = props.dependencies

    const declaredProps: TDeclaredProps = {
      functionName: namespaced(scope, 'DeliveryJobSolverJobQueryLambda'),
      description: 'Delivery Job by Solver Job Query function',
      code: lambda.Code.fromAsset(common_lambda.getLambdaDistPath(__dirname, '@lambda/delivery-solver-query.zip')),
      dependencies: props.dependencies,
      timeout: core.Duration.seconds(30),
      runtime: lambda.Runtime.NODEJS_16_X,
      layers: [lambdaUtilsLayer],
      environment: {
        DDB_TABLE: deliveryJobs.tableName,
        MANAGER_NAME: 'deliveryJobBySolverJob',
      },
      initialPolicy: [common_iam.PolicyStatements.ddb.readDDBTable(deliveryJobs.tableArn)],
    }

    super(scope, id, declaredProps)
  }
}
