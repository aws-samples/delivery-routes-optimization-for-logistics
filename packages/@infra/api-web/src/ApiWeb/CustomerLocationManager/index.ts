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
  readonly customerLocations: ddb.ITable
  readonly lambdaUtilsLayer: lambda.ILayerVersion
}

type TDeclaredProps = common_lambda.DeclaredLambdaProps<Environment, Dependencies>

export class CustomerLocationManagerLambda extends common_lambda.DeclaredLambdaFunction<Environment, Dependencies> {
  constructor(scope: Construct, id: string, props: common_lambda.ExposedDeclaredLambdaProps<Dependencies>) {
    const { customerLocations, lambdaUtilsLayer } = props.dependencies

    const declaredProps: TDeclaredProps = {
      functionName: namespaced(scope, 'CustomerLocationManager'),
      description: 'Customer Locations Manager functions',
      code: lambda.Code.fromAsset(common_lambda.getLambdaDistPath(__dirname, '@lambda/customer-location-manager.zip')),
      dependencies: props.dependencies,
      timeout: core.Duration.seconds(30),
      runtime: lambda.Runtime.NODEJS_16_X,
      layers: [lambdaUtilsLayer],
      environment: {
        DDB_TABLE: customerLocations.tableName,
        MANAGER_NAME: 'customerLocation',
      },
      initialPolicy: [
        common_iam.PolicyStatements.ddb.readDDBTable(customerLocations.tableArn),
        common_iam.PolicyStatements.ddb.updateDDBTable(customerLocations.tableArn),
        common_iam.PolicyStatements.ddb.deleteFromDDBTable(customerLocations.tableArn),
      ],
    }

    super(scope, id, declaredProps)
  }
}
