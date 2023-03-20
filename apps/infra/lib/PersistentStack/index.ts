/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { Construct } from 'constructs'
import * as core from 'aws-cdk-lib'
import { aws_s3 as s3, aws_ssm as ssm, aws_ec2 as ec2, CfnOutput } from 'aws-cdk-lib'
import { setNamespace } from '@infra/common'
import { DataStorage } from '@infra/data-storage'
import { IdentityStack } from '@infra/cognito-auth'
import { WebsiteHosting } from '@infra/web-hosting'
import { VpcPersistent } from '@infra/networking'

export interface PersistentBackendStackProps extends core.StackProps {
  readonly namespace: string
  readonly administratorEmail: string
  readonly administratorName: string
  readonly parameterStoreKeys: Record<string, string>
}

/**
 * Persistence backend stack
 */
export class PersistentBackendStack extends core.Stack {
  readonly dataStorage: DataStorage

  readonly identityStack: IdentityStack

  readonly websiteBucket: s3.IBucket

  readonly vpc: ec2.IVpc

  constructor(scope: Construct, id: string, props: PersistentBackendStackProps) {
    super(scope, id, props)

    const { namespace, administratorEmail, administratorName, parameterStoreKeys } = props

    setNamespace(this, namespace)

    const vpcPersistent = new VpcPersistent(this, 'VpcPersistent', {
      vpcName: 'Vpc',
      vpcCidr: '10.0.0.0/16',
    })
    const vpcParmas = new ssm.StringParameter(this, 'VpcIdParams', {
      parameterName: parameterStoreKeys.commonVpcId,
      stringValue: vpcPersistent.vpc.vpcId,
      description: `VpcIdParams for dispatcher`,
    })

    const dataStorage = new DataStorage(this, 'DataStorage', {
      parameterStoreKeys,
    })

    const identityStack = new IdentityStack(this, 'Identity', {
      administratorEmail,
      administratorName,
    })

    const websiteHosting = new WebsiteHosting(this, 'WebsiteHosting', {
      bucketName: 'website',

      // react routing helper
      errorConfigurations: [
        {
          errorCode: 404,
          responseCode: 200,
          responsePagePath: '/',
        },
      ],
    })

    new CfnOutput(this, 'WebHostingDomain', {
      exportName: 'WebHostingDomain',
      value : websiteHosting.cloudFrontDistribution.distributionDomainName
    })

    this.dataStorage = dataStorage
    this.identityStack = identityStack
    this.websiteBucket = websiteHosting.hostingBucket
    this.vpc = vpcPersistent.vpc
  }
}
