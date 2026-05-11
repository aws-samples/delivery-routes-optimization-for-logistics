/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */
import { Stack, StackProps } from 'aws-cdk-lib'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as ssm from 'aws-cdk-lib/aws-ssm'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as s3 from 'aws-cdk-lib/aws-s3'
import { Construct } from 'constructs'
import { RootConfig } from '../config'
import { setNamespace } from '../utils/namespace'
import { PolicyStatements } from '../utils/policies'
import { EcsFargateTask } from '../constructs/EcsEc2Task'

export interface DistanceCacheStackProps extends StackProps, Omit<RootConfig, 'env'> {
  readonly vpc: ec2.IVpc
}

export class DistanceCacheStack extends Stack {
  constructor(scope: Construct, id: string, props: DistanceCacheStackProps) {
    super(scope, id, props)

    setNamespace(this, props.namespace)

    // Customer locations data (source for distance calculation)
    const locationTableName = ssm.StringParameter.valueForStringParameter(
      this,
      props.parameterStoreKeys.customerLocationsTableName,
    )
    const locationTable = dynamodb.Table.fromTableName(this, 'DdbSourceTable', locationTableName)

    // S3 Bucket for storing distance cache files
    const distCacheBucketName = ssm.StringParameter.valueForStringParameter(
      this,
      props.parameterStoreKeys.distanceCacheBucket,
    )
    const outputBucket = s3.Bucket.fromBucketName(this, 'OutputBucketName', distCacheBucketName)

    // History of built distance cache
    const distCacheTableName = ssm.StringParameter.valueForStringParameter(
      this,
      props.parameterStoreKeys.distanceCacheTableName,
    )
    const distCacheTable = dynamodb.Table.fromTableName(this, 'DistCacheTable', distCacheTableName)

    // Container execution policies
    const taskPolicies: { [name: string]: iam.PolicyDocument } = {
      parameterStoreAccess: new iam.PolicyDocument({
        statements: [PolicyStatements.ssm.readParams(this.region, this.account)],
      }),
      bucketAccess: new iam.PolicyDocument({
        statements: [PolicyStatements.s3.writeBucket(outputBucket.bucketArn)],
      }),
      ddbAccess: new iam.PolicyDocument({
        statements: [
          PolicyStatements.ddb.readDDBTable(locationTable.tableArn),
          PolicyStatements.ddb.readDDBTable(distCacheTable.tableArn),
          PolicyStatements.ddb.updateDDBTable(distCacheTable.tableArn),
          PolicyStatements.ddb.batchWriteDDBTable(distCacheTable.tableArn),
        ],
      }),
    }

    // ECS Cluster and Task (Fargate)
    const ecsTask = new EcsFargateTask(this, 'EcsTask', {
      vpc: props.vpc,
      dockerImagePath: props.assets.distanceCacheDockerPath,
      hardwareType: props.fargateOptions.distCacheArchitecture,
      cpu: props.fargateOptions.distCacheCpu,
      memoryMiB: props.fargateOptions.distCacheMemory,
      taskPolicies,
    })

    new ssm.StringParameter(this, 'ClusterNameParam', {
      parameterName: props.parameterStoreKeys.distanceCacheClusterName,
      stringValue: ecsTask.cluster.clusterName,
    })

    new ssm.StringParameter(this, 'AsgCapacityProviderParam', {
      parameterName: props.parameterStoreKeys.distanceCacheAsgCapacityProvider,
      stringValue: 'FARGATE',
    })

    new ssm.StringParameter(this, 'TaskDefArnParam', {
      parameterName: props.parameterStoreKeys.distanceCacheTaskDefArn,
      stringValue: ecsTask.taskDefinitionArn,
    })

    new ssm.StringParameter(this, 'ContainerNameParam', {
      parameterName: props.parameterStoreKeys.distanceCacheContainerName,
      stringValue: ecsTask.containerName,
    })
  }
}
