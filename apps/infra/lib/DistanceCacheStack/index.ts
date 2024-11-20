/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import * as core from 'aws-cdk-lib'
import * as path from 'path'
import { aws_ssm as ssm, aws_dynamodb, aws_s3, aws_ec2, aws_iam as iam } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { setNamespace, common_iam } from '@aws-samples/common'
import { sync as findup } from 'find-up'
import { EcsEc2Task } from '@aws-samples/ecs-task'

export interface DistanceCacheStackProps extends core.StackProps {
  readonly namespace: string
  readonly vpc: aws_ec2.IVpc
  readonly instanceOptions: Record<string, string>
  readonly parameterStoreKeys: Record<string, string>
}

export class DistanceCacheStack extends core.Stack {
  readonly ecsTask: EcsEc2Task

  constructor(scope: Construct, id: string, props: DistanceCacheStackProps) {
    super(scope, id, props)

    const { 
      namespace, vpc, 
      instanceOptions: { distCacheInstanceType, distCacheHardwareType }, 
      parameterStoreKeys : { 
        customerLocationsTableName, distanceCacheBucket, distanceCacheTableName, 
        distanceCacheClusterName, distanceCacheAsgCapacityProvider, distanceCacheTaskDefArn, distanceCacheContainerName
      }
    } = props
    setNamespace(this, namespace)

    // Customer locations data
    const tableName = ssm.StringParameter.valueForStringParameter(this, customerLocationsTableName)
    const locationTable = aws_dynamodb.Table.fromTableName(this, 'DdbSourceTable', tableName)

    // S3 Bucket for store distance cache file
    const bucketName = ssm.StringParameter.valueForStringParameter(this, distanceCacheBucket)
    const outputBucket = aws_s3.Bucket.fromBucketName(this, 'OutputBucketName', bucketName)

    // history of build distance cache
    const distCacheTableName = ssm.StringParameter.valueForStringParameter(this, distanceCacheTableName)
    const distCacheTable = aws_dynamodb.Table.fromTableName(this, 'DistCacheTable', distCacheTableName)

    // container execution policies
    const taskPolicies = {
      parameterStoreAccess: new iam.PolicyDocument({
        statements: [common_iam.PolicyStatements.ssm.readSSMParams(this.region, this.account)],
      }),
      bucketAccess: new iam.PolicyDocument({
        statements: [common_iam.PolicyStatements.s3.writeBucket(outputBucket.bucketArn)],
      }),
      ddbAccess: new iam.PolicyDocument({
        statements: [
          common_iam.PolicyStatements.ddb.readDDBTable(locationTable.tableArn),
          common_iam.PolicyStatements.ddb.readDDBTable(distCacheTable.tableArn),
          common_iam.PolicyStatements.ddb.updateDDBTable(distCacheTable.tableArn),
          common_iam.PolicyStatements.ddb.batchWriteDDBTable(distCacheTable.tableArn),
        ],
      }),
    }

    // Dockerfile path
    const imagePath = path.join(
      findup('apps', { cwd: __dirname, type: 'directory' }) || '../../../../',
      '..',
      'opt-engine',
      'build',
      'distancecache-util',
    )

    // create ECS Cluster, Task
    this.ecsTask = new EcsEc2Task(this, 'DistanceCache', {
      // VPC for ECS EC2 instance
      vpc,

      // ParameterStore keys for ECS Task parameters
      keyClusterName: distanceCacheClusterName,
      keyCapacityProvider: distanceCacheAsgCapacityProvider,
      keyTaskDefArn: distanceCacheTaskDefArn,
      keyContainerName: distanceCacheContainerName,

      // Task policies
      taskPolicies: taskPolicies,

      // Docker image path to build
      dockerImagePath: imagePath,

      // Instance Options
      instanceOptions: {
        instanceType: distCacheInstanceType,
        hardwareType: distCacheHardwareType
      },

      // default command for ECS task
      taskCommands: [
        'java',
        '-jar',
        `-Daws.region=${this.region}`,
        'distance-cache-util-jar-with-dependencies.jar',
        'build-lat-long',
        'ddb',
        '--loctablename=$LOC_TABLE_NAME',
        '--bucketname=$BUCKET_NAME',
        '--tablename=$TABLE_NAME',
        '--warehouse=$WAREHOUSE_CODE'
      ],
    })
  }
}
