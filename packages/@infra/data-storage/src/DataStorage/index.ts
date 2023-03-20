/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { Construct } from 'constructs'
import * as core from 'aws-cdk-lib'
import { aws_dynamodb as ddb, aws_s3 as s3, aws_ssm as ssm } from 'aws-cdk-lib'
import { namespaced, namespacedBucket } from '@infra/common'

export interface DataStorageProps extends core.NestedStackProps {
  readonly parameterStoreKeys: Record<string, string>
}

export class DataStorage extends core.NestedStack {
  public readonly orders: ddb.ITable

  public readonly solverJobs: ddb.ITable

  public readonly deliveryJobs: ddb.ITable

  public readonly customerLocations: ddb.ITable

  public readonly warehouses: ddb.ITable

  public readonly vehicles: ddb.ITable

  public readonly distCache: ddb.ITable

  public readonly distCacheBucket: s3.IBucket

  public readonly ssmStringParameters: Record<string, ssm.IStringParameter>

  constructor(scope: Construct, id: string, props: DataStorageProps) {
    super(scope, id, props)

    const { parameterStoreKeys } = props
    this.ssmStringParameters = {}

    // ORDERS ---------------------------------------------------------------------------------------------------------
    const orders = new ddb.Table(this, 'OrdersTable', {
      tableName: namespaced(this, 'orders'),
      removalPolicy: props.removalPolicy,
      partitionKey: {
        name: 'Id',
        type: ddb.AttributeType.STRING,
      },
      billingMode: ddb.BillingMode.PAY_PER_REQUEST,
      encryption: ddb.TableEncryption.AWS_MANAGED,
    })
    this.orders = orders

    const ordersStatusIndex = 'idx-orders-status'
    orders.addGlobalSecondaryIndex({
      indexName: ordersStatusIndex,
      partitionKey: {
        name: 'status',
        type: ddb.AttributeType.STRING,
      },
      sortKey: {
        name: 'updatedAt',
        type: ddb.AttributeType.NUMBER,
      },
    })

    this.addToSsmStringParameters(
      'orders-table-param',
      parameterStoreKeys.ordersTableName,
      orders.tableName,
      'Orders tablename',
    )

    this.addToSsmStringParameters(
      'orders-status-index-param',
      parameterStoreKeys.ordersStatusIndex,
      ordersStatusIndex,
      'Orders status index',
    )

    // SOLVER JOBS ----------------------------------------------------------------------------------------------------
    this.solverJobs = new ddb.Table(this, 'SolverJobsTable', {
      tableName: namespaced(this, 'solver-jobs'),
      removalPolicy: props.removalPolicy,
      partitionKey: {
        name: 'Id',
        type: ddb.AttributeType.STRING,
      },
      billingMode: ddb.BillingMode.PAY_PER_REQUEST,
      encryption: ddb.TableEncryption.AWS_MANAGED,
    })

    this.addToSsmStringParameters(
      'solver-jobs-table-param',
      parameterStoreKeys.solverJobsTableName,
      this.solverJobs.tableName,
      'Solver Jobs tablename',
    )

    // DELIVERY JOBS --------------------------------------------------------------------------------------------------
    const deliveryJobs = new ddb.Table(this, 'DeliveryJobsTable', {
      tableName: namespaced(this, 'delivery-jobs'),
      removalPolicy: props.removalPolicy,
      partitionKey: {
        name: 'Id',
        type: ddb.AttributeType.STRING,
      },
      billingMode: ddb.BillingMode.PAY_PER_REQUEST,
      encryption: ddb.TableEncryption.AWS_MANAGED,
    })
    this.deliveryJobs = deliveryJobs

    const deliveryJobSolverJobIndex = 'idx-delivery-job-solver-job'
    deliveryJobs.addGlobalSecondaryIndex({
      indexName: deliveryJobSolverJobIndex,
      partitionKey: {
        name: 'solverJobId',
        type: ddb.AttributeType.STRING,
      },
    })

    this.addToSsmStringParameters(
      'delivery-jobs-table-param',
      parameterStoreKeys.deliveryJobsTableName,
      this.deliveryJobs.tableName,
      'Delivery Jobs tablename',
    )

    this.addToSsmStringParameters(
      'delivery-jobs-solverjobid-param',
      parameterStoreKeys.deliveryJobSolverJobIdIndex,
      deliveryJobSolverJobIndex,
      'DeliveryJobs solverJobId index',
    )

    // CUSTOMER LOCATIONS  --------------------------------------------------------------------------------------------
    const customerLocations = new ddb.Table(this, 'CustomerLocationsTable', {
      tableName: namespaced(this, 'customer-locations'),
      removalPolicy: props.removalPolicy,
      partitionKey: {
        name: 'Id',
        type: ddb.AttributeType.STRING,
      },
      billingMode: ddb.BillingMode.PAY_PER_REQUEST,
      encryption: ddb.TableEncryption.AWS_MANAGED,
    })
    this.customerLocations = customerLocations

    this.addToSsmStringParameters(
      'customer-locations-table-param',
      parameterStoreKeys.customerLocationsTableName,
      this.customerLocations.tableName,
      'Customer Locations tablename',
    )

    const customerLocationsWarehouseCodeIndex = 'idx-customer-locations-warehouse-code'
    customerLocations.addGlobalSecondaryIndex({
      indexName: customerLocationsWarehouseCodeIndex,
      partitionKey: {
        name: 'warehouseCode',
        type: ddb.AttributeType.STRING,
      },
    })

    this.addToSsmStringParameters(
      'customer-locations-warehouse-code-param',
      parameterStoreKeys.customerLocationsWarehouseCodeIndex,
      customerLocationsWarehouseCodeIndex,
      'customer Locations Warehouse Code index',
    )

    // WAREHOUSES  --------------------------------------------------------------------------------------------
    const warehouses = new ddb.Table(this, 'WarehousesTable', {
      tableName: namespaced(this, 'warehouses'),
      removalPolicy: props.removalPolicy,
      partitionKey: {
        name: 'Id',
        type: ddb.AttributeType.STRING,
      },
      billingMode: ddb.BillingMode.PAY_PER_REQUEST,
      encryption: ddb.TableEncryption.AWS_MANAGED,
    })
    this.warehouses = warehouses

    this.addToSsmStringParameters(
      'warehouses-table-param',
      parameterStoreKeys.warehousesTableName,
      this.warehouses.tableName,
      'warehouses tablename',
    )
          
    const warehousesCodeIndex = 'idx-warehouses-code'
    warehouses.addGlobalSecondaryIndex({
      indexName: warehousesCodeIndex,
      partitionKey: {
        name: 'warehouseCode',
        type: ddb.AttributeType.STRING,
      },
    })

    this.addToSsmStringParameters(
      'warehouses-code-param',
      parameterStoreKeys.warehouseCodeIndex,
      warehousesCodeIndex,
      'warehouses Code index',
    )

    // VEHICLES  ------------------------------------------------------------------------------------------------------
    this.vehicles = new ddb.Table(this, 'VehiclesTable', {
      tableName: namespaced(this, 'vehicles'),
      removalPolicy: props.removalPolicy,
      partitionKey: {
        name: 'Id',
        type: ddb.AttributeType.STRING,
      },
      billingMode: ddb.BillingMode.PAY_PER_REQUEST,
      encryption: ddb.TableEncryption.AWS_MANAGED,
    })

    this.addToSsmStringParameters(
      'vehicles-table-param',
      parameterStoreKeys.vehiclesTableName,
      this.vehicles.tableName,
      'Vehicles tablename',
    )

    // DISTANCE CACHE BUCKET -------------------------------------------------------------------------------------------
    this.distCacheBucket = new s3.Bucket(this, 'DistanceCacheBucket', {
      bucketName: namespacedBucket(this, 'distance-cache'),
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    })

    this.addToSsmStringParameters(
      'distance-cache-param',
      parameterStoreKeys.distanceCacheBucket,
      this.distCacheBucket.bucketName,
      'Distance Cache upload bucket name',
    )

    const distCacheTable = new ddb.Table(this, 'DistanceCacheTable', {
      tableName: namespaced(this, 'distance-cache'),
      removalPolicy: props.removalPolicy,
      partitionKey: {
        name: 'Id',
        type: ddb.AttributeType.STRING,
      },
      billingMode: ddb.BillingMode.PAY_PER_REQUEST,
      encryption: ddb.TableEncryption.AWS_MANAGED,
    })
    this.distCache = distCacheTable

    this.addToSsmStringParameters(
      'distance-cache-table',
      parameterStoreKeys.distanceCacheTableName,
      this.distCache.tableName,
      'Distance Cache index DDB table',
    )
  }

  addToSsmStringParameters(resourceId: string, paramName: string, paramValue: string, descriptionKey: string): void {
    this.ssmStringParameters[paramName] = new ssm.StringParameter(this, resourceId, {
      parameterName: paramName,
      stringValue: paramValue,
      description: `${descriptionKey} parameter for dispatcher`,
    })
  }
}
