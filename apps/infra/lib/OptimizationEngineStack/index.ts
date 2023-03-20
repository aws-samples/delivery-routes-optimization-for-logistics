/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import * as path from 'path'
import {
  aws_ssm as ssm,
  aws_dynamodb as ddb,
  aws_s3 as s3,
  aws_ec2 as ec2,
  aws_iam as iam,
  Stack,
  StackProps,
} from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { setNamespace, common_iam } from '@infra/common'
import { sync as findup } from 'find-up'
import { EcsEc2Task } from '@infra/ecs-task'

export interface OptimizationEngineStackProps extends StackProps {
  readonly namespace: string
  readonly vpc: ec2.IVpc
  readonly instanceOptions: Record<string, string>
  readonly parameterStoreKeys: Record<string, string>
}

export class OptimizationEngineStack extends Stack {
  readonly ecsTask: EcsEc2Task

  constructor(scope: Construct, id: string, props: OptimizationEngineStackProps) {
    super(scope, id, props)

    const { namespace, vpc, 
      instanceOptions : { optEngineInstanceType, optEngineHardwareType }, 
      parameterStoreKeys : { 
        customerLocationsTableName, distanceCacheBucket, distanceCacheTableName,
        vehiclesTableName, warehousesTableName, ordersTableName,
        solverJobsTableName, deliveryJobsTableName,
        optEngineClusterName, optEngineAsgCapacityProvider, optEngineTaskDefArn, optEngineContainerName
      }
    } = props
    setNamespace(this, namespace)

    // Distance Cache
    const distCacheBucketName = ssm.StringParameter.valueForStringParameter(this, distanceCacheBucket)
    const distCacheBucket = s3.Bucket.fromBucketName(this, 'DistCacheBucketName', distCacheBucketName)
    const distCacheTable = this.getDdbTableByParameter(distanceCacheTableName, 'DistCacheTable')

    // Master data for dispatching order
    const customerTable = this.getDdbTableByParameter(
      customerLocationsTableName,
      'CustomerLocationsTable',
    )
    const vehicleTable = this.getDdbTableByParameter(vehiclesTableName, 'VehicleTable')
    const warehouseTable = this.getDdbTableByParameter(warehousesTableName, 'WarehouseTable')

    // Orders
    const orderTable = this.getDdbTableByParameter(ordersTableName, 'OrdersTable')

    // DDB Tables for optimization engine job status and results
    const solverJopTable = this.getDdbTableByParameter(solverJobsTableName, 'SolverJobTable')
    const deloveryJobTable = this.getDdbTableByParameter(deliveryJobsTableName, 'DeliveryJobTable')

    // Task policies for container
    const taskPolicies = {
      parameterStoreAccess: new iam.PolicyDocument({
        statements: [common_iam.PolicyStatements.ssm.readSSMParams(this.region, this.account)],
      }),
      distCache: new iam.PolicyDocument({
        statements: [
          common_iam.PolicyStatements.s3.readBucket(distCacheBucket.bucketArn),
          common_iam.PolicyStatements.ddb.readDDBTable(distCacheTable.tableArn)
        ],
      }),
      masterData: new iam.PolicyDocument({
        statements: [
          common_iam.PolicyStatements.ddb.readDDBTable(customerTable.tableArn),
          common_iam.PolicyStatements.ddb.readDDBTable(vehicleTable.tableArn),
          common_iam.PolicyStatements.ddb.readDDBTable(warehouseTable.tableArn),
        ],
      }),
      orderData: new iam.PolicyDocument({
        statements: [common_iam.PolicyStatements.ddb.readDDBTable(orderTable.tableArn)],
      }),
      solveResult: new iam.PolicyDocument({
        statements: [
          common_iam.PolicyStatements.ddb.readDDBTable(solverJopTable.tableArn),
          common_iam.PolicyStatements.ddb.updateDDBTable(solverJopTable.tableArn),
          common_iam.PolicyStatements.ddb.batchWriteDDBTable(deloveryJobTable.tableArn),
        ],
      }),
    }

    // Dockerfile path
    const imagePath = path.join(
      findup('apps', { cwd: __dirname, type: 'directory' }) || '../../../../',
      '..',
      'opt-engine',
      'build',
      'nextday-delivery',
    )

    // ECS Cluster, Task
    this.ecsTask = new EcsEc2Task(this, 'OptEngine', {
      // VPC for ECS EC2 instance
      vpc,

      // ParameterStore keys for ECS Task parameters
      keyClusterName: optEngineClusterName,
      keyCapacityProvider: optEngineAsgCapacityProvider,
      keyTaskDefArn: optEngineTaskDefArn,
      keyContainerName: optEngineContainerName,

      // Task policies
      taskPolicies: taskPolicies,

      // Docker image path to build
      dockerImagePath: imagePath,

      // Instance Options
      instanceOptions: {
        instanceType: optEngineInstanceType,
        hardwareType: optEngineHardwareType
      },

      // default command for ECS task
      taskCommands: [
        'java',
        '-jar',
        '-Dorder-date=$ORDER_DATE',
        '-Dwarehouse-code=$WAREHOUSE_CODE',
        'delivery-dispatch-runner.jar',
      ],
    })
  }

  // Util : Get DDB Table from SSM ParameterStore values
  private getDdbTableByParameter(ssmKeyForDDbName: string, resourceName: string): ddb.ITable {
    const tableName = ssm.StringParameter.valueForStringParameter(this, ssmKeyForDDbName)

    return ddb.Table.fromTableName(this, resourceName, tableName)
  }
}
