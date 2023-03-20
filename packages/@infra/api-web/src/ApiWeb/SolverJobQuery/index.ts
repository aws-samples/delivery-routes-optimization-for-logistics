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
  readonly solverJobs: ddb.ITable
  readonly lambdaUtilsLayer: lambda.ILayerVersion
}

type TDeclaredProps = common_lambda.DeclaredLambdaProps<Environment, Dependencies>

export class SolverJobQueryLambda extends common_lambda.DeclaredLambdaFunction<Environment, Dependencies> {
  constructor(scope: Construct, id: string, props: common_lambda.ExposedDeclaredLambdaProps<Dependencies>) {
    const { solverJobs, lambdaUtilsLayer } = props.dependencies

    const declaredProps: TDeclaredProps = {
      functionName: namespaced(scope, 'SolverJobQueryLambda'),
      description: 'Solver Job Query function',
      code: lambda.Code.fromAsset(common_lambda.getLambdaDistPath(__dirname, '@lambda/solver-job-query.zip')),
      dependencies: props.dependencies,
      timeout: core.Duration.seconds(30),
      runtime: lambda.Runtime.NODEJS_16_X,
      layers: [lambdaUtilsLayer],
      environment: {
        DDB_TABLE: solverJobs.tableName,
        MANAGER_NAME: 'solverJob',
      },
      initialPolicy: [
        common_iam.PolicyStatements.ddb.readDDBTable(solverJobs.tableArn),
        common_iam.PolicyStatements.ddb.updateDDBTable(solverJobs.tableArn),
        common_iam.PolicyStatements.ddb.deleteFromDDBTable(solverJobs.tableArn),
      ],
    }

    super(scope, id, declaredProps)
  }
}
