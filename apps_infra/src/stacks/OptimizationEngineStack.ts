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

export interface OptimizationEngineStackProps extends StackProps, Omit<RootConfig, 'env'> {
  readonly vpc: ec2.IVpc
}

export class OptimizationEngineStack extends Stack {
  constructor(scope: Construct, id: string, props: OptimizationEngineStackProps) {
    super(scope, id, props)

    setNamespace(this, props.namespace)

    // Distance Cache (S3 + DDB)
    const distCacheBucketName = ssm.StringParameter.valueForStringParameter(
      this,
      props.parameterStoreKeys.distanceCacheBucket,
    )
    const distCacheBucket = s3.Bucket.fromBucketName(this, 'DistCacheBucketName', distCacheBucketName)

    const distCacheTableName = ssm.StringParameter.valueForStringParameter(
      this,
      props.parameterStoreKeys.distanceCacheTableName,
    )
    const distCacheTable = dynamodb.Table.fromTableName(this, 'DistCacheTable', distCacheTableName)

    // Master data for dispatching order
    const customerTableName = ssm.StringParameter.valueForStringParameter(
      this,
      props.parameterStoreKeys.customerLocationsTableName,
    )
    const customerTable = dynamodb.Table.fromTableName(this, 'CustomerLocationsTable', customerTableName)

    const vehicleTableName = ssm.StringParameter.valueForStringParameter(
      this,
      props.parameterStoreKeys.vehiclesTableName,
    )
    const vehicleTable = dynamodb.Table.fromTableName(this, 'VehicleTable', vehicleTableName)

    const warehouseTableName = ssm.StringParameter.valueForStringParameter(
      this,
      props.parameterStoreKeys.warehousesTableName,
    )
    const warehouseTable = dynamodb.Table.fromTableName(this, 'WarehouseTable', warehouseTableName)

    // Orders
    const orderTableName = ssm.StringParameter.valueForStringParameter(
      this,
      props.parameterStoreKeys.ordersTableName,
    )
    const orderTable = dynamodb.Table.fromTableName(this, 'OrdersTable', orderTableName)

    // DDB Tables for optimization engine job status and results
    const solverJobTableName = ssm.StringParameter.valueForStringParameter(
      this,
      props.parameterStoreKeys.solverJobsTableName,
    )
    const solverJobTable = dynamodb.Table.fromTableName(this, 'SolverJobTable', solverJobTableName)

    const deliveryJobTableName = ssm.StringParameter.valueForStringParameter(
      this,
      props.parameterStoreKeys.deliveryJobsTableName,
    )
    const deliveryJobTable = dynamodb.Table.fromTableName(this, 'DeliveryJobTable', deliveryJobTableName)

    // Task policies for container
    const taskPolicies: { [name: string]: iam.PolicyDocument } = {
      parameterStoreAccess: new iam.PolicyDocument({
        statements: [PolicyStatements.ssm.readParams(this.region, this.account)],
      }),
      distCache: new iam.PolicyDocument({
        statements: [
          PolicyStatements.s3.readBucket(distCacheBucket.bucketArn),
          PolicyStatements.ddb.readDDBTable(distCacheTable.tableArn),
        ],
      }),
      masterData: new iam.PolicyDocument({
        statements: [
          PolicyStatements.ddb.readDDBTable(customerTable.tableArn),
          PolicyStatements.ddb.readDDBTable(vehicleTable.tableArn),
          PolicyStatements.ddb.readDDBTable(warehouseTable.tableArn),
        ],
      }),
      orderData: new iam.PolicyDocument({
        statements: [PolicyStatements.ddb.readDDBTable(orderTable.tableArn)],
      }),
      solveResult: new iam.PolicyDocument({
        statements: [
          PolicyStatements.ddb.readDDBTable(solverJobTable.tableArn),
          PolicyStatements.ddb.updateDDBTable(solverJobTable.tableArn),
          PolicyStatements.ddb.batchWriteDDBTable(deliveryJobTable.tableArn),
        ],
      }),
    }

    // ECS Cluster and Task (Fargate)
    const ecsTask = new EcsFargateTask(this, 'EcsTask', {
      vpc: props.vpc,
      dockerImagePath: props.assets.optEngineDockerPath,
      hardwareType: props.fargateOptions.optEngineArchitecture,
      cpu: props.fargateOptions.optEngineCpu,
      memoryMiB: props.fargateOptions.optEngineMemory,
      taskPolicies,
    })

    new ssm.StringParameter(this, 'ClusterNameParam', {
      parameterName: props.parameterStoreKeys.optEngineClusterName,
      stringValue: ecsTask.cluster.clusterName,
    })

    new ssm.StringParameter(this, 'AsgCapacityProviderParam', {
      parameterName: props.parameterStoreKeys.optEngineAsgCapacityProvider,
      stringValue: 'FARGATE',
    })

    new ssm.StringParameter(this, 'TaskDefArnParam', {
      parameterName: props.parameterStoreKeys.optEngineTaskDefArn,
      stringValue: ecsTask.taskDefinitionArn,
    })

    new ssm.StringParameter(this, 'ContainerNameParam', {
      parameterName: props.parameterStoreKeys.optEngineContainerName,
      stringValue: ecsTask.containerName,
    })
  }
}
