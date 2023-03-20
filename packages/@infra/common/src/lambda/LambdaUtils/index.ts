/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { Construct } from 'constructs'
import { aws_apigateway as apigw, aws_lambda as lambda } from 'aws-cdk-lib'
import { namespaced } from '../../'
import { getLambdaDistPath } from '../DeclaredLambdaFunction'
import { RestApi } from '../../apigw'
import { HTTPMethod } from 'http-method-enum'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface LambdaUtilsLayerProps {}

export class LambdaUtilsLayer extends Construct {
  readonly lambdaUtilsLayer: lambda.ILayerVersion

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(scope: Construct, id: string, props: LambdaUtilsLayerProps) {
    super(scope, id)

    const lambdaUtilsLayer = new lambda.LayerVersion(this, 'LambdaUtilsLayer', {
      compatibleRuntimes: [lambda.Runtime.NODEJS_16_X],
      description: 'Lambda Utils Layer',
      layerVersionName: namespaced(this, 'LambdaUtils'),
      code: lambda.Code.fromAsset(getLambdaDistPath(__dirname, '@lambda/lambda-utils.zip')),
    })

    this.lambdaUtilsLayer = lambdaUtilsLayer
  }
}

interface AllowMethods {
  listGet?: boolean
  withIdGet?: boolean
  post?: boolean
  put?: boolean
  delete?: boolean
}

export interface RegisterManagerFunctionProps {
  restApi: RestApi
  endpoint: apigw.IResource
  withIdEndpoint: apigw.IResource
  lambdaFunction: lambda.Function
  methodOptions?: apigw.MethodOptions
  allowMethods?: AllowMethods
}

export const AllowQueryMethods: AllowMethods = {
  listGet: true,
  withIdGet: true,
  post: false,
  put: false,
  delete: false,
}

export const AllowAllMethods: AllowMethods = {
  listGet: true,
  withIdGet: true,
  post: true,
  put: true,
  delete: true,
}

export const registerManagerFunction = (props: RegisterManagerFunctionProps): void => {
  const { restApi, endpoint, withIdEndpoint, lambdaFunction, methodOptions, allowMethods } = props

  const allow = { ...AllowAllMethods, ...allowMethods }

  // :: ListAll
  if (allow.listGet) {
    restApi.addFunctionToResource(endpoint, {
      function: lambdaFunction,
      httpMethod: HTTPMethod.GET,
      methodOptions,
    })
  }

  // :: GetById
  if (allow.withIdGet) {
    restApi.addFunctionToResource(withIdEndpoint, {
      function: lambdaFunction,
      httpMethod: HTTPMethod.GET,
      methodOptions,
    })
  }

  // :: CreateNew
  if (allow.post) {
    restApi.addFunctionToResource(endpoint, {
      function: lambdaFunction,
      httpMethod: HTTPMethod.POST,
      methodOptions,
    })
  }

  // :: Update
  if (allow.put) {
    restApi.addFunctionToResource(endpoint, {
      function: lambdaFunction,
      httpMethod: HTTPMethod.PUT,
      methodOptions,
    })
  }

  // :: Delete
  if (allow.delete) {
    restApi.addFunctionToResource(withIdEndpoint, {
      function: lambdaFunction,
      httpMethod: HTTPMethod.DELETE,
      methodOptions,
    })
  }
}
