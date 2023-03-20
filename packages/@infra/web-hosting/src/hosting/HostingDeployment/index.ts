/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { Construct } from 'constructs'
import { aws_s3 as s3, aws_s3_deployment as s3d } from 'aws-cdk-lib'

/**
 * Properties for creating the website s3 deployment
 */
export interface HostingDeploymentProps {
  /**
   * The file/folder on the local disk pointing to the website bundle
   */
  readonly websiteBundlePath: string

  /**
   * Reference to the hosting bucket
   */
  readonly hostingBucket: s3.IBucket

  /**
   * The destination key prefix in the S3 bucket
   */
  readonly destinationKeyPrefix?: string
}

export class HostingDeployment extends Construct {
  /**
   * Creates an S3 bucket deployment
   * @param scope The scope to create this resource in
   * @param id The id of the construct
   * @param props The @type {HostingDeploymentProps} props
   */
  constructor(scope: Construct, id: string, props: HostingDeploymentProps) {
    super(scope, id)

    const { websiteBundlePath, destinationKeyPrefix = '/', hostingBucket } = props

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const bucketDeployment = new s3d.BucketDeployment(this, 'HostingBD', {
      destinationBucket: hostingBucket,
      sources: [s3d.Source.asset(websiteBundlePath)],
      destinationKeyPrefix,
    })
  }
}
