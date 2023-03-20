/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { Construct } from 'constructs'
import * as core from 'aws-cdk-lib'
import { aws_s3 as s3 } from 'aws-cdk-lib'
import { sync as findUp } from 'find-up'
import * as path from 'path'
import { setNamespace } from '@infra/common'
import { ApiWeb } from '@infra/api-web'
import { AppVariables, HostingDeployment } from '@infra/web-hosting'
import { PersistentBackendStack } from '../PersistentStack'

export interface BackendStackProps extends core.StackProps {
  readonly namespace: string
  readonly persistent: PersistentBackendStack
  readonly parameterStoreKeys: Record<string, string>
  readonly mapBoxToken: string
}

/**
 * Backend stack
 */
export class BackendStack extends core.Stack {
  constructor(scope: Construct, id: string, props: BackendStackProps) {
    super(scope, id, props)

    const {
      namespace,
      persistent: {
        dataStorage: { customerLocations, warehouses, solverJobs, deliveryJobs, orders, vehicles, distCache },
        identityStack: { userPool, webAppClientId },
        websiteBucket,
      },
      parameterStoreKeys,
      mapBoxToken,
    } = props

    setNamespace(this, namespace)

    const region = this.region
    const account = this.account
    const webApi = new ApiWeb(this, 'ApiWeb', {
      region,
      account,
      userPool,
      customerLocations,
      warehouses,
      solverJobs,
      deliveryJobs,
      orders,
      vehicles,
      distCache,
      parameterStoreKeys,
    })

    const websiteBucketRef = s3.Bucket.fromBucketArn(this, 'WebsiteBucket', websiteBucket.bucketArn)
    const appVars = {
      REGION: this.region,
      USERPOOL_ID: userPool.userPoolId,
      USERPOOL_CLIENT_ID: webAppClientId,
      API_URL: webApi.restApi.url,
      MAPBOX_TOKEN: mapBoxToken,
    }

    // find the website and solver bundle
    const appsDir = findUp('apps', { cwd: __dirname, type: 'directory' }) || '../../../'
    const websiteBundlePath = path.join(appsDir, 'website', 'build')

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const hostingDeployment = new HostingDeployment(this, 'WebsiteHostingDeployment', {
      websiteBundlePath,
      hostingBucket: websiteBucketRef,
    })

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const appVariables = new AppVariables(this, 'WebsiteAppVars', {
      appVars,
      hostingBucket: websiteBucketRef,
      appVarDestinationKey: 'static/appvars.js',
    })
  }
}
