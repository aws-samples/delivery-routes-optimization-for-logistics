/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { Construct } from 'constructs'
import { aws_s3 as s3, aws_iam as iam, custom_resources as cr } from 'aws-cdk-lib'
import { namespaced } from '@aws-samples/common'

/**
 * Properties for creating App variables
 */
export interface AppVariablesProps {
  /**
   * Key-value pairs (allows nested objects) to hold variables
   */
  // eslint-disable-next-line prettier/prettier
  readonly appVars: Record<string, any>

  /**
   * Reference to the hosting bucket
   */
  readonly hostingBucket: s3.IBucket

  /**
   * Destination key in the hosting bucket.
   * @default 'assets/appVariables.js'
   */
  readonly appVarDestinationKey?: string

  /**
   * File format to generate. Either 'js' or 'json'.
   */
  readonly appVarFormat?: 'js' | 'json'
}

export class AppVariables extends Construct {
  constructor(scope: Construct, id: string, props: AppVariablesProps) {
    super(scope, id)

    const { appVars, appVarDestinationKey = 'assets/appVariables.js', hostingBucket, appVarFormat = 'js' } = props

    const customResourcePolicy = cr.AwsCustomResourcePolicy.fromSdkCalls({
      resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE,
    })

    customResourcePolicy.statements.push(
      new iam.PolicyStatement({
        actions: ['s3:putObject*'],
        effect: iam.Effect.ALLOW,
        resources: [hostingBucket.bucketArn, `${hostingBucket.bucketArn}/*`],
      }),
    )

    let appVariablesString = ''

    if (appVarFormat === 'js') {
      appVariablesString = `'use strict'\n\nconst appVariables = ${JSON.stringify(appVars, null, 2)}\n`
    } else if (appVarFormat === 'json') {
      appVariablesString = JSON.stringify(appVars, null, 2)
    }

    // console.log(appVariablesString)

    const appVariablesResourceParams = {
      service: 'S3',
      action: 'putObject',
      parameters: {
        Bucket: hostingBucket.bucketName,
        Key: appVarDestinationKey,
        Body: appVariablesString,
      },
      physicalResourceId: cr.PhysicalResourceId.of(namespaced(this, 'onWebDeploymentAppVars')),
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const appVariablesResource = new cr.AwsCustomResource(this, 'appVariablesResource', {
      onCreate: appVariablesResourceParams,
      onUpdate: appVariablesResourceParams,
      policy: customResourcePolicy,
    })
  }
}
