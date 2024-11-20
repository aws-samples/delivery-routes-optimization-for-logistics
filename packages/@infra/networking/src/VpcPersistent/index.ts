/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { Construct } from 'constructs'
import { Tags, aws_ec2 as ec2 } from 'aws-cdk-lib'
import { namespaced, retainResource } from '@aws-samples/common'

export interface VpcPersistentProps {
  readonly vpcCidr: string
  readonly vpcName: string
}

export class VpcPersistent extends Construct {
  readonly vpc: ec2.IVpc

  constructor(scope: Construct, id: string, props: VpcPersistentProps) {
    super(scope, id)

    const { vpcCidr, vpcName } = props

    // create a VPC
    const vpc = new ec2.Vpc(this, 'Vpc', {
      ipAddresses: ec2.IpAddresses.cidr(vpcCidr),

      maxAzs: 3,

      subnetConfiguration: [
        {
          subnetType: ec2.SubnetType.PUBLIC,
          name: namespaced(this, 'public'),
          cidrMask: 24,
        },
        {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
          name: namespaced(this, 'private'),
        },
        {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
          name: namespaced(this, 'isolated'),
        },
      ],
      natGateways: 1, // PROD: review this value
      natGatewayProvider: ec2.NatProvider.gateway(),
    })

    Tags.of(vpc).add('Name', namespaced(this, vpcName))

    retainResource(vpc)

    this.vpc = vpc
  }
}
