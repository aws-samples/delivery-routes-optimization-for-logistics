/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { Construct } from 'constructs'
import { aws_s3 as s3, aws_iam as iam, aws_cloudfront as cloudfront } from 'aws-cdk-lib'
import { namespacedBucket, retainResource } from '@aws-samples/common'

/**
 * Properties for creating website hosting construct
 */
export interface WebsiteHostingProps {
  /**
   * The name of the bucket to create
   * @default websitebucket
   */
  readonly bucketName?: string

  /**
   * The name of the websiteIndexDocument
   * @default index.html
   */
  readonly indexDocument?: string

  /**
   * The name of the websiteErrorDocument
   * @default error.html
   */
  readonly errorDocument?: string

  /**
   * Indicate to retain the S3 bucket
   * @default true
   */
  readonly retainResources?: boolean

  /**
   * Additional hosting bucket configuration
   * A list of IBucket - pathPattern pairs
   */
  readonly additionalHostingBuckets?: [
    {
      hostingBucket: s3.IBucket
      originPath?: string
      pathPattern: string
      allowUpload: boolean
    },
  ]

  readonly errorConfigurations?: cloudfront.CfnDistribution.CustomErrorResponseProperty[]
}

/**
 * Reporesents a WebsiteHosting construct
 */
export class WebsiteHosting extends Construct {
  /**
   * The S3 bucket that hosts the website
   */
  readonly hostingBucket: s3.IBucket

  /**
   * The CloudFront distribution to host the website
   */
  readonly cloudFrontDistribution: cloudfront.CloudFrontWebDistribution

  constructor(scope: Construct, id: string, props: WebsiteHostingProps) {
    super(scope, id)

    const {
      indexDocument = 'index.html',
      errorDocument = 'error.html',
      bucketName = 'websitebucket',
      retainResources = true,
      additionalHostingBuckets,
      errorConfigurations,
    } = props

    // S3 :: WebsiteBucket
    const hostingBucket = new s3.Bucket(this, 'HostingBucket', {
      bucketName: namespacedBucket(this, bucketName),
      encryption: s3.BucketEncryption.S3_MANAGED,
      websiteIndexDocument: indexDocument,
      websiteErrorDocument: errorDocument,
      blockPublicAccess: {
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
    })

    if (retainResources) {
      retainResource(hostingBucket)
    }

    // Cloudfront :: OIA
    const cloudFrontOia = new cloudfront.OriginAccessIdentity(this, 'CF-OIA', {
      comment: 'OIA for hosting buckets',
    })

    // grant permission for cloudfront to the s3 bucket
    hostingBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ['s3:GetObject*', 's3:List*'],
        resources: [hostingBucket.bucketArn, `${hostingBucket.bucketArn}/*`],
        principals: [cloudFrontOia.grantPrincipal],
      }),
    )

    const originConfigs: cloudfront.SourceConfiguration[] = []

    if (additionalHostingBuckets !== undefined) {
      const readActions = ['s3:GetObject*', 's3:List*']
      const rwActions = [...readActions, 's3:PutObject*']

      additionalHostingBuckets.forEach((additionalHosting) => {
        additionalHosting.hostingBucket.addToResourcePolicy(
          new iam.PolicyStatement({
            actions: additionalHosting.allowUpload ? rwActions : readActions,
            resources: [additionalHosting.hostingBucket.bucketArn, `${additionalHosting.hostingBucket.bucketArn}/*`],
            principals: [cloudFrontOia.grantPrincipal],
          }),
        )

        originConfigs.push({
          s3OriginSource: {
            s3BucketSource: additionalHosting.hostingBucket,
            originAccessIdentity: cloudFrontOia,
            originPath: additionalHosting.originPath,
          },
          behaviors: [
            {
              allowedMethods: additionalHosting.allowUpload
                ? cloudfront.CloudFrontAllowedMethods.ALL
                : cloudfront.CloudFrontAllowedMethods.GET_HEAD_OPTIONS,
              isDefaultBehavior: false,
              pathPattern: additionalHosting.pathPattern,
            },
          ],
        })
      })
    }

    // cloudfront web distribution
    const cloudFrontDistribution = new cloudfront.CloudFrontWebDistribution(this, 'CloudFrontDistro', {
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: hostingBucket,
            originAccessIdentity: cloudFrontOia,
          },
          behaviors: [
            {
              allowedMethods: cloudfront.CloudFrontAllowedMethods.ALL,
              isDefaultBehavior: true,
            },
          ],
        },
        ...originConfigs,
      ],
      defaultRootObject: indexDocument,
      priceClass: cloudfront.PriceClass.PRICE_CLASS_ALL,
      errorConfigurations,
    })

    this.cloudFrontDistribution = cloudFrontDistribution
    this.hostingBucket = hostingBucket
  }
}
