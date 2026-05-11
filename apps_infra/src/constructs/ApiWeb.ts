/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */
import { Construct } from 'constructs'
import * as cdk from 'aws-cdk-lib'
import * as apigw from 'aws-cdk-lib/aws-apigateway'
import * as cognito from 'aws-cdk-lib/aws-cognito'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as s3 from 'aws-cdk-lib/aws-s3'
import { AppNodejsFunction } from './NodejsFn'
import { namespaced } from '../utils/namespace'
import { PolicyStatements } from '../utils/policies'

export interface ApiWebProps {
  readonly region: string
  readonly account: string
  readonly userPool: cognito.IUserPool
  readonly customerLocations: dynamodb.ITable
  readonly warehouses: dynamodb.ITable
  readonly solverJobs: dynamodb.ITable
  readonly deliveryJobs: dynamodb.ITable
  readonly orders: dynamodb.ITable
  readonly vehicles: dynamodb.ITable
  readonly distCache: dynamodb.ITable
  readonly distanceCacheBucket: s3.IBucket
  readonly parameterStoreKeys: Record<string, string>
}

interface CrudRegConfig {
  base: string
  idParam: string
  handlerPath: string
  env: Record<string, string>
  grant: (fn: AppNodejsFunction) => void
  authorizer: apigw.IAuthorizer
  api: apigw.RestApi
  readOnly?: boolean
  timeout?: number
}

export class ApiWeb extends Construct {
  public readonly restApi: apigw.RestApi

  constructor(scope: Construct, id: string, props: ApiWebProps) {
    super(scope, id)

    const api = new apigw.RestApi(this, 'RestApi-Web', {
      restApiName: namespaced(this, 'WebApi'),
      defaultCorsPreflightOptions: {
        allowOrigins: apigw.Cors.ALL_ORIGINS,
        allowMethods: apigw.Cors.ALL_METHODS,
      },
    })
    this.restApi = api

    const authorizer = new apigw.CognitoUserPoolsAuthorizer(this, 'CognitoAuthorizer', {
      cognitoUserPools: [props.userPool],
    })

    const authOpts: apigw.MethodOptions = {
      authorizer,
      authorizationType: apigw.AuthorizationType.COGNITO,
    }

    const registerCrud = (cfg: CrudRegConfig) => {
      const fn = new AppNodejsFunction(this, cfg.base.replace(/\//g, '-'), {
        handlerPath: cfg.handlerPath,
        environment: cfg.env,
        ...(cfg.timeout ? { timeout: cdk.Duration.seconds(cfg.timeout) } : {}),
      })
      cfg.grant(fn)

      // Build resource path: e.g. api/web/customer-location → split by '/'
      const parts = cfg.base.split('/')
      let resource: apigw.IResource = cfg.api.root
      for (const part of parts) {
        resource = resource.getResource(part) ?? resource.addResource(part)
      }

      // List endpoint (GET on base)
      resource.addMethod('GET', new apigw.LambdaIntegration(fn), authOpts)

      if (!cfg.readOnly) {
        // Create endpoint (POST on base)
        resource.addMethod('POST', new apigw.LambdaIntegration(fn), authOpts)
      }

      // ID resource
      const idResource = resource.addResource(`{${cfg.idParam}}`)
      idResource.addMethod('GET', new apigw.LambdaIntegration(fn), authOpts)

      if (!cfg.readOnly) {
        idResource.addMethod('PUT', new apigw.LambdaIntegration(fn), authOpts)
        idResource.addMethod('DELETE', new apigw.LambdaIntegration(fn), authOpts)
      }
    }

    // CRUD managers
    registerCrud({
      base: 'api/web/customer-location',
      idParam: 'customerLocationId',
      handlerPath: 'api-web/customer-location-manager/index.ts',
      env: { TABLE_NAME: props.customerLocations.tableName },
      grant: (fn) => props.customerLocations.grantReadWriteData(fn),
      authorizer,
      api,
    })

    registerCrud({
      base: 'api/web/warehouse',
      idParam: 'warehouseId',
      handlerPath: 'api-web/warehouse-manager/index.ts',
      env: { TABLE_NAME: props.warehouses.tableName },
      grant: (fn) => props.warehouses.grantReadWriteData(fn),
      authorizer,
      api,
    })

    registerCrud({
      base: 'api/web/vehicle',
      idParam: 'vehicleId',
      handlerPath: 'api-web/vehicle-manager/index.ts',
      env: { TABLE_NAME: props.vehicles.tableName },
      grant: (fn) => props.vehicles.grantReadWriteData(fn),
      authorizer,
      api,
    })

    // Query endpoints (read-write for orders/solver-job/delivery-jobs)
    registerCrud({
      base: 'api/web/order',
      idParam: 'orderId',
      handlerPath: 'api-web/orders-query/index.ts',
      env: { TABLE_NAME: props.orders.tableName },
      grant: (fn) => props.orders.grantReadData(fn),
      authorizer,
      api,
      readOnly: true,
    })

    registerCrud({
      base: 'api/web/solver-job',
      idParam: 'solverJobId',
      handlerPath: 'api-web/solver-job-query/index.ts',
      env: { TABLE_NAME: props.solverJobs.tableName },
      grant: (fn) => props.solverJobs.grantReadData(fn),
      authorizer,
      api,
      readOnly: true,
    })

    registerCrud({
      base: 'api/web/delivery-job',
      idParam: 'deliveryJobId',
      handlerPath: 'api-web/delivery-jobs-query/index.ts',
      env: { TABLE_NAME: props.deliveryJobs.tableName },
      grant: (fn) => props.deliveryJobs.grantReadData(fn),
      authorizer,
      api,
      readOnly: true,
    })

    registerCrud({
      base: 'api/web/delivery-solver-job',
      idParam: 'deliveryJobBySolverJobId',
      handlerPath: 'api-web/delivery-job-by-solver-job-query/index.ts',
      env: { TABLE_NAME: props.deliveryJobs.tableName, INDEX_NAME: 'idx-delivery-job-solver-job' },
      grant: (fn) => props.deliveryJobs.grantReadData(fn),
      authorizer,
      api,
      readOnly: true,
    })

    registerCrud({
      base: 'api/web/dist-cache',
      idParam: 'distCacheId',
      handlerPath: 'api-web/distance-cache-query/index.ts',
      env: { TABLE_NAME: props.distCache.tableName },
      grant: (fn) => props.distCache.grantReadData(fn),
      authorizer,
      api,
      readOnly: true,
    })

    // Rebuild distance cache (build-dist-cache/{warehouseCode})
    registerCrud({
      base: 'api/web/build-dist-cache',
      idParam: 'warehouseCode',
      handlerPath: 'api-web/rebuild-distance-cache/index.ts',
      env: {
        SSM_CLUSTER: props.parameterStoreKeys.distanceCacheClusterName,
        SSM_CAPACITY_PROVIDER: props.parameterStoreKeys.distanceCacheAsgCapacityProvider,
        SSM_CONTAINER: props.parameterStoreKeys.distanceCacheContainerName,
        SSM_TASK_DEF: props.parameterStoreKeys.distanceCacheTaskDefArn,
        SSM_BUCKET: props.parameterStoreKeys.distanceCacheBucket,
        SSM_LOC_TABLE: props.parameterStoreKeys.customerLocationsTableName,
        SSM_CACHE_TABLE: props.parameterStoreKeys.distanceCacheTableName,
        SSM_VPC_ID: props.parameterStoreKeys.commonVpcId,
      },
      grant: (fn) => {
        fn.addToRolePolicy(PolicyStatements.ssm.readParams(props.region, props.account))
        fn.addToRolePolicy(
          new iam.PolicyStatement({
            actions: ['ecs:RunTask', 'iam:PassRole'],
            resources: ['*'],
          }),
        )
        fn.addToRolePolicy(
          new iam.PolicyStatement({
            actions: ['ec2:DescribeSubnets'],
            resources: ['*'],
          }),
        )
      },
      authorizer,
      api,
      readOnly: true,
    })

    // Get S3 presigned URL
    const presignedFn = new AppNodejsFunction(this, 'GetS3PresignedUrl', {
      handlerPath: 'api-web/get-s3-presigned-url/index.ts',
      environment: {
        BUCKET_NAME: props.distanceCacheBucket.bucketName,
      },
    })
    props.distanceCacheBucket.grantRead(presignedFn)

    // presigned-url uses the same resource tree pattern
    const apiResource = api.root.getResource('api') ?? api.root.addResource('api')
    const webResource = (apiResource as apigw.Resource).getResource('web') ?? (apiResource as apigw.Resource).addResource('web')
    const presignedPath = (webResource as apigw.Resource).addResource('presigned-url')
    presignedPath.addMethod('GET', new apigw.LambdaIntegration(presignedFn), authOpts)
  }
}
