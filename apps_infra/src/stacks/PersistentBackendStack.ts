/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */
import { CfnOutput, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib'
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront'
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins'
import * as cognito from 'aws-cdk-lib/aws-cognito'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as ssm from 'aws-cdk-lib/aws-ssm'
import { Construct } from 'constructs'
import { RootConfig } from '../config'
import { setNamespace, namespaced, namespacedBucket } from '../utils/namespace'

export interface PersistentBackendStackProps extends StackProps, Omit<RootConfig, 'env'> {}

export class PersistentBackendStack extends Stack {
  // VPC
  public readonly vpc: ec2.Vpc

  // DynamoDB Tables
  public readonly customerLocations: dynamodb.Table
  public readonly warehouses: dynamodb.Table
  public readonly vehicles: dynamodb.Table
  public readonly orders: dynamodb.Table
  public readonly solverJobs: dynamodb.Table
  public readonly deliveryJobs: dynamodb.Table
  public readonly distanceCache: dynamodb.Table

  // S3
  public readonly distanceCacheBucket: s3.Bucket
  public readonly websiteBucket: s3.Bucket

  // Cognito
  public readonly userPool: cognito.UserPool
  public readonly userPoolClient: cognito.UserPoolClient

  // CloudFront
  public readonly distribution: cloudfront.Distribution

  constructor(scope: Construct, id: string, props: PersistentBackendStackProps) {
    super(scope, id, props)

    setNamespace(this, props.namespace)

    const keys = props.parameterStoreKeys

    // ─── VPC ───────────────────────────────────────────────────────────────────

    this.vpc = new ec2.Vpc(this, 'Vpc', {
      maxAzs: 2,
      natGateways: 1,
      natGatewayProvider: ec2.NatProvider.gateway(),
      subnetConfiguration: [
        { cidrMask: 24, name: 'Public', subnetType: ec2.SubnetType.PUBLIC },
        { cidrMask: 24, name: 'Private', subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      ],
    })
    this.vpc.applyRemovalPolicy(RemovalPolicy.RETAIN)

    new ssm.StringParameter(this, 'VpcIdParam', {
      parameterName: keys.commonVpcId,
      stringValue: this.vpc.vpcId,
    })

    // ─── DynamoDB Tables ───────────────────────────────────────────────────────

    // CUSTOMER LOCATIONS
    this.customerLocations = new dynamodb.Table(this, 'CustomerLocationsTable', {
      tableName: namespaced(this, 'customer-locations'),
      partitionKey: { name: 'Id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
      removalPolicy: RemovalPolicy.DESTROY,
    })
    this.customerLocations.addGlobalSecondaryIndex({
      indexName: 'idx-customer-locations-warehouse-code',
      partitionKey: { name: 'warehouseCode', type: dynamodb.AttributeType.STRING },
    })

    // WAREHOUSES
    this.warehouses = new dynamodb.Table(this, 'WarehousesTable', {
      tableName: namespaced(this, 'warehouses'),
      partitionKey: { name: 'Id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
      removalPolicy: RemovalPolicy.DESTROY,
    })
    this.warehouses.addGlobalSecondaryIndex({
      indexName: 'idx-warehouses-code',
      partitionKey: { name: 'warehouseCode', type: dynamodb.AttributeType.STRING },
    })

    // VEHICLES
    this.vehicles = new dynamodb.Table(this, 'VehiclesTable', {
      tableName: namespaced(this, 'vehicles'),
      partitionKey: { name: 'Id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
      removalPolicy: RemovalPolicy.DESTROY,
    })

    // ORDERS
    this.orders = new dynamodb.Table(this, 'OrdersTable', {
      tableName: namespaced(this, 'orders'),
      partitionKey: { name: 'Id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
      removalPolicy: RemovalPolicy.DESTROY,
    })
    this.orders.addGlobalSecondaryIndex({
      indexName: 'idx-orders-status',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'updatedAt', type: dynamodb.AttributeType.NUMBER },
    })

    // SOLVER JOBS
    this.solverJobs = new dynamodb.Table(this, 'SolverJobsTable', {
      tableName: namespaced(this, 'solver-jobs'),
      partitionKey: { name: 'Id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
      removalPolicy: RemovalPolicy.DESTROY,
    })

    // DELIVERY JOBS
    this.deliveryJobs = new dynamodb.Table(this, 'DeliveryJobsTable', {
      tableName: namespaced(this, 'delivery-jobs'),
      partitionKey: { name: 'Id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
      removalPolicy: RemovalPolicy.DESTROY,
    })
    this.deliveryJobs.addGlobalSecondaryIndex({
      indexName: 'idx-delivery-job-solver-job',
      partitionKey: { name: 'solverJobId', type: dynamodb.AttributeType.STRING },
    })

    // DISTANCE CACHE
    this.distanceCache = new dynamodb.Table(this, 'DistanceCacheTable', {
      tableName: namespaced(this, 'distance-cache'),
      partitionKey: { name: 'Id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
      removalPolicy: RemovalPolicy.DESTROY,
    })

    // ─── S3 Bucket for distance cache ──────────────────────────────────────────

    this.distanceCacheBucket = new s3.Bucket(this, 'DistanceCacheBucket', {
      bucketName: namespacedBucket(this, 'distance-cache'),
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    })

    // ─── SSM Parameters (Data Storage) ────────────────────────────────────────

    new ssm.StringParameter(this, 'CustomerLocationsTableParam', {
      parameterName: keys.customerLocationsTableName,
      stringValue: this.customerLocations.tableName,
    })
    new ssm.StringParameter(this, 'CustomerLocationsWarehouseCodeIndexParam', {
      parameterName: keys.customerLocationsWarehouseCodeIndex,
      stringValue: 'idx-customer-locations-warehouse-code',
    })
    new ssm.StringParameter(this, 'WarehousesTableParam', {
      parameterName: keys.warehousesTableName,
      stringValue: this.warehouses.tableName,
    })
    new ssm.StringParameter(this, 'WarehouseCodeIndexParam', {
      parameterName: keys.warehouseCodeIndex,
      stringValue: 'idx-warehouses-code',
    })
    new ssm.StringParameter(this, 'VehiclesTableParam', {
      parameterName: keys.vehiclesTableName,
      stringValue: this.vehicles.tableName,
    })
    new ssm.StringParameter(this, 'OrdersTableParam', {
      parameterName: keys.ordersTableName,
      stringValue: this.orders.tableName,
    })
    new ssm.StringParameter(this, 'OrdersStatusIndexParam', {
      parameterName: keys.ordersStatusIndex,
      stringValue: 'idx-orders-status',
    })
    new ssm.StringParameter(this, 'SolverJobsTableParam', {
      parameterName: keys.solverJobsTableName,
      stringValue: this.solverJobs.tableName,
    })
    new ssm.StringParameter(this, 'DeliveryJobsTableParam', {
      parameterName: keys.deliveryJobsTableName,
      stringValue: this.deliveryJobs.tableName,
    })
    new ssm.StringParameter(this, 'DeliveryJobSolverJobIdIndexParam', {
      parameterName: keys.deliveryJobSolverJobIdIndex,
      stringValue: 'idx-delivery-job-solver-job',
    })
    new ssm.StringParameter(this, 'DistanceCacheTableParam', {
      parameterName: keys.distanceCacheTableName,
      stringValue: this.distanceCache.tableName,
    })
    new ssm.StringParameter(this, 'DistanceCacheBucketParam', {
      parameterName: keys.distanceCacheBucket,
      stringValue: this.distanceCacheBucket.bucketName,
    })

    // ─── Cognito ───────────────────────────────────────────────────────────────

    this.userPool = new cognito.UserPool(this, 'UserPool', {
      selfSignUpEnabled: false,
      signInAliases: { email: true },
      autoVerify: { email: true },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      standardAttributes: {
        email: { required: true, mutable: true },
      },
    })

    this.userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPool: this.userPool,
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
    })

    new cognito.CfnUserPoolUser(this, 'AdminUser', {
      userPoolId: this.userPool.userPoolId,
      username: props.administratorEmail,
      userAttributes: [
        { name: 'email', value: props.administratorEmail },
        { name: 'name', value: props.administratorName },
      ],
      desiredDeliveryMediums: ['EMAIL'],
    })

    // ─── Website Hosting (CloudFront + S3) ─────────────────────────────────────

    this.websiteBucket = new s3.Bucket(this, 'WebBucket', {
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    })

    this.distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(this.websiteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
      ],
    })

    new CfnOutput(this, 'WebHostingDomainOutput', {
      value: this.distribution.distributionDomainName,
      exportName: namespaced(this, 'WebHostingDomain'),
    })
  }
}
