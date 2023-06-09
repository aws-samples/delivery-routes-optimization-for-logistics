/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { Construct } from 'constructs'
import {
  aws_apigateway as apigw,
  aws_iam as iam,
  aws_lambda as lambda,
  aws_lambda_nodejs as lambda_nodejs,
} from 'aws-cdk-lib'
import { namespaced, uniqueIdHash } from '../../'
import { ServicePrincipals, ManagedPolicies } from 'cdk-constants'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface RestApiProps extends apigw.RestApiProps {}

interface BaseFunctionToResourceProps {
  httpMethod: string
  methodOptions?: apigw.MethodOptions
}

export interface CreateFunctionToResourceProps extends BaseFunctionToResourceProps {
  functionId: string
  functionProps: lambda.FunctionProps | lambda_nodejs.NodejsFunctionProps
}

export interface AddFunctionToResourceProps extends BaseFunctionToResourceProps {
  function: lambda.IFunction
}

export class RestApi extends apigw.RestApi {
  private static defaultProps({ endpointTypes, ...props }: RestApiProps): RestApiProps {
    return {
      ...props,
      endpointTypes: endpointTypes || [apigw.EndpointType.REGIONAL],
    }
  }

  constructor(scope: Construct, id: string, props: RestApiProps) {
    super(scope, id, RestApi.defaultProps(props))

    // dummy
    this.root.addMethod('ANY')

    let { restApiName } = props

    if (!restApiName) {
      restApiName = `restApi-${uniqueIdHash(this)}`
    }
  }

  addApiKeyWithUsagePlanAndStage(apiKeyId: string, usagePlanName?: string): apigw.IApiKey {
    const _usagePlanName = usagePlanName || `${apiKeyId}-usagePlan`

    // create the api key
    const apiKey = this.addApiKey(`${apiKeyId}-${uniqueIdHash(this)}`, {
      apiKeyName: namespaced(this, apiKeyId),
    })

    // usage plan
    const usagePlan = this.addUsagePlan(`${apiKeyId}-usagePlan`, {
      name: _usagePlanName,
    })
    usagePlan.addApiKey(apiKey)

    // stage
    usagePlan.addApiStage({ api: this, stage: this.deploymentStage })

    return apiKey
  }

  addResourceWithAbsolutePath(path: string): apigw.IResource {
    return this.root.resourceForPath(path)
  }

  addCognitoAuthorizer(providerArns: string[]): apigw.CfnAuthorizer {
    // add cognito authorizer
    const cognitoAuthorizer = new apigw.CfnAuthorizer(this, `CognitoAuthorizer-${uniqueIdHash(this)}`, {
      name: namespaced(this, 'CognitoAuthorizer'),
      identitySource: 'method.request.header.Authorization',
      providerArns,
      restApiId: this.restApiId,
      type: apigw.AuthorizationType.COGNITO,
    })

    return cognitoAuthorizer
  }

  // helper for add*FunctionToResource
  private createDefaultLambdaRole(id: string, functionName: string): iam.Role {
    return new iam.Role(this, `${id}-role-${uniqueIdHash(this)}`, {
      assumedBy: new iam.ServicePrincipal(ServicePrincipals.LAMBDA),
      description: `Execution role for ${functionName}`,
      managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName(ManagedPolicies.AWS_LAMBDA_EXECUTE)],
      roleName: namespaced(this, functionName),
    })
  }

  private createFunctionToResource<TProps extends lambda.FunctionProps | lambda_nodejs.NodejsFunctionProps>(
    resource: apigw.IResource,
    props: CreateFunctionToResourceProps,
    FnType: {
      new (scope: Construct, id: string, fnProps: TProps): lambda.IFunction
    },
  ): lambda.IFunction {
    const { httpMethod, functionId, functionProps, methodOptions } = props

    const { functionName, role } = functionProps

    if (functionName === undefined) {
      throw new Error('You need to provide a functionName property')
    }

    let lambdaExecutionRole

    if (role === undefined) {
      lambdaExecutionRole = this.createDefaultLambdaRole(functionId, functionName)
    }

    const lambdaFunctionProps = {
      ...(functionProps as TProps),
      role: role || lambdaExecutionRole,
      functionName: namespaced(this, functionName),
    }

    const lambdaFunction = new FnType(this, `${functionId}-fn-${uniqueIdHash(this)}`, lambdaFunctionProps)

    this.addFunctionToResource(resource, {
      httpMethod,
      methodOptions,
      function: lambdaFunction,
    })

    return lambdaFunction
  }

  addFunctionToResource(resource: apigw.IResource, props: AddFunctionToResourceProps): void {
    const { httpMethod, methodOptions, function: lambdaFunction } = props

    const lambdaIntegration = new apigw.LambdaIntegration(lambdaFunction)
    resource.addMethod(httpMethod, lambdaIntegration, methodOptions)
  }

  createLambdaFunctionToResource(resource: apigw.IResource, props: CreateFunctionToResourceProps): lambda.IFunction {
    const { functionProps } = props

    if ((functionProps as lambda.FunctionProps) === undefined) {
      throw new Error('functionProps must be of type FunctionProps')
    }

    return this.createFunctionToResource(resource, props, lambda.Function)
  }

  createNodejsFunctionToResource(resource: apigw.IResource, props: CreateFunctionToResourceProps): lambda.IFunction {
    const { functionProps } = props

    if ((functionProps as lambda_nodejs.NodejsFunctionProps) === undefined) {
      throw new Error('functionProps must be of type NodejsFunctionProps')
    }

    return this.createFunctionToResource(resource, props, lambda_nodejs.NodejsFunction)
  }
}
