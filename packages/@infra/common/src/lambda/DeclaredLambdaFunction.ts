/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { Construct } from 'constructs'
import * as core from 'aws-cdk-lib'
import { aws_lambda as lambda } from 'aws-cdk-lib'
import * as path from 'path'
import { sync as findup } from 'find-up'

export interface DeclaredLambdaEnvironment {
  [key: string]: string
}

export interface DeclaredLambdaDependencies {
  [key: string]: any
}

/**
 * ExposedDeclaredLambdaProps interface defines the properties that are exposed
 * to final constructor of declared lambda implementation. Only the `dependencies`
 * property should be made available to constructor while everything else is defined
 * within the implementation.
 */
export interface ExposedDeclaredLambdaProps<TDependencies> {
  readonly dependencies: TDependencies
}

export interface DeclaredLambdaProps<
  TEnvironment extends DeclaredLambdaEnvironment,
  TDependencies extends DeclaredLambdaDependencies,
> extends Omit<lambda.FunctionProps, 'environment' | 'runtime' | 'handler' | 'code'> {
  readonly environment: TEnvironment
  readonly dependencies: TDependencies
  code?: lambda.FunctionProps['code']
  handler?: lambda.FunctionProps['handler']
  runtime?: lambda.FunctionProps['runtime']
}

/**
 * Helper method for getting path to lambda output in dist. This will allow
 * referencing lambda definition in both the src and dist; assuming the lambda has
 * been built to the dist prior.
 * @param fromDir The base directory were lambda dist is output to. Both source and dist must
 * live in same root dir.
 * @param lambdaPathInDist The relative path of lambda within the dist output.
 */
export function getLambdaDistPath(fromDir: string, lambdaPathInDist: string): string {
  if (!path.isAbsolute(fromDir)) {
    throw new Error(`Param "fromDir" must be absolute: ${fromDir}`)
  }

  const dist = findup('dist', { cwd: fromDir, type: 'directory' })

  if (dist == null) {
    throw new Error(`Failed to find "dist" folder for "${lambdaPathInDist}" from "${fromDir}"`)
  }

  return path.join(dist, lambdaPathInDist)
}

/**
 * `DeclaredLambdaFunction` class is a declarative pattern for implementing Lambda functions
 * in a consistent way that encapsulates dependencies and integration of lambda functions.
 *
 * This pattern enforces the use of defining environment and dependencies used by the
 * lambda function and role respectively.
 */
export class DeclaredLambdaFunction<
    TEnvironment extends DeclaredLambdaEnvironment,
    TDependencies extends DeclaredLambdaDependencies,
  >
  extends lambda.Function
  implements lambda.IFunction
{
  readonly dependencies: TDependencies

  /**
   * Helper method for getting path to lambda output in dist. This will allow
   * referencing lambda definition in both the src and dist; assuming the lambda has
   * been built to the dist prior.
   * @param fromDir The base directory were lambda dist is output to. Both source and dist must
   * live in same root dir.
   * @param lambdaPathInDist The relative path of lambda within the dist output.
   */
  static getLambdaDistPath(fromDir: string, lambdaPathInDist: string): string {
    return getLambdaDistPath(fromDir, lambdaPathInDist)
  }

  /**
   * [Override] This method should be overriden by lambda classes to define the path
   * to the lambda zip/dir/file/etc. If not defined by lambda declaration class, it
   * must provide `props.code` to the constructor.
   * @see DeclaredLambdaFunction#getLambdaDistPath - can help assist with defining this path
   */
  static get codeDirectory(): string {
    throw new Error(`${this.name}.codeDirectory does not exist`)
  }

  /**
   * Gets reference to lambda code asset use by function.
   * @throws `XXXDeclaredLambdaFunction.codeDirectory does not exist` if lambda declaration does
   * not define the `codeDirectory` static method.
   */
  static get assetCode(): lambda.AssetCode {
    return lambda.Code.fromAsset(this.codeDirectory)
  }

  protected constructor(scope: Construct, id: string, props: DeclaredLambdaProps<TEnvironment, TDependencies>) {
    // Set defaults
    props = Object.assign(
      {
        timeout: core.Duration.seconds(10),
        memorySize: 256,
        handler: 'index.handler',
        runtime: lambda.Runtime.NODEJS_16_X,
      },
      props,
    )

    if (props.code == null) {
      props.code = DeclaredLambdaFunction.assetCode
    }

    super(scope, id, props as unknown as lambda.FunctionProps)

    this.dependencies = props.dependencies
  }
}
