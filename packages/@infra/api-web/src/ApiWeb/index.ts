/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { Construct } from 'constructs'
import { aws_apigateway as apigw, aws_cognito as cognito, aws_dynamodb as ddb, aws_s3 as s3 } from 'aws-cdk-lib'
import { namespaced, common_apigw, common_lambda } from '@infra/common'
import { CustomerLocationManagerLambda } from './CustomerLocationManager'
import { WarehouseManagerLambda } from './WarehouseManager'
import { DeliveryJobQueryLambda } from './DeliveryJobsQuery'
import { OrderQueryLambda } from './OrdersQuery'
import { SolverJobQueryLambda } from './SolverJobQuery'
import { VehicleManagerLambda } from './VehicleManager'
import { DeliveryJobSolverJobQueryLambda } from './DeliveryJobBySolverJobQuery'
import { RebuildDistanceCacheLambda } from './RebuildDistanceCacheQuery'
import { DistanceCacheQueryLambda } from './DistanceCacheQuery'

export interface ApiWebProps {
  readonly region: string
  readonly account: string
  readonly apiPrefix?: string
  readonly userPool: cognito.IUserPool
  readonly customerLocations: ddb.ITable
  readonly warehouses: ddb.ITable
  readonly solverJobs: ddb.ITable
  readonly deliveryJobs: ddb.ITable
  readonly orders: ddb.ITable
  readonly vehicles: ddb.ITable
  readonly distCache: ddb.ITable
  readonly parameterStoreKeys: Record<string, string>
}

export class ApiWeb extends Construct {
  readonly restApi: common_apigw.RestApi

  constructor(scope: Construct, id: string, props: ApiWebProps) {
    super(scope, id)

    const {
      region,
      account,
      apiPrefix = 'api/web',
      userPool,
      customerLocations,
      warehouses,
      solverJobs,
      deliveryJobs,
      orders,
      vehicles,
      distCache,
      parameterStoreKeys,
    } = props

    const customerLocationUrlBase = `${apiPrefix}/customer-location`
    const rebuildDistanceCacheUrlBase = `${apiPrefix}/build-dist-cache`
    const warehouseUrlBase = `${apiPrefix}/warehouse`
    const solverJobsUrlBase = `${apiPrefix}/solver-job`
    const deliveryJobsUrlBase = `${apiPrefix}/delivery-job`
    const downloadS3FileUrlBase = `${apiPrefix}/dl`
    const ordersUrlBase = `${apiPrefix}/order`
    const vehiclesUrlBase = `${apiPrefix}/vehicle`
    const deliveryJobSolverJobsUrlBase = `${apiPrefix}/delivery-solver-job`
    const distCacheUrlBase = `${apiPrefix}/dist-cache`

    // TODO: Add WAF
    const restApi = new common_apigw.RestApi(this, 'RestApi-Web', {
      restApiName: namespaced(this, 'WebApi'),
      defaultCorsPreflightOptions: {
        allowOrigins: apigw.Cors.ALL_ORIGINS,
        allowMethods: apigw.Cors.ALL_METHODS,
      },
    })
    this.restApi = restApi

    const cognitoAuthorizer = restApi.addCognitoAuthorizer([userPool.userPoolArn])
    const authorizerMethodOpt: apigw.MethodOptions = {
      authorizer: { authorizerId: cognitoAuthorizer.ref },
      authorizationType: apigw.AuthorizationType.COGNITO,
    }

    const { lambdaUtilsLayer } = new common_lambda.LambdaUtilsLayer(this, 'LambdaUtilsLayer', {})

    // ENDPOINTS and HANDLERS
    // CUSTOMER LOCATIONS  --------------------------------------------------------------------------------------------
    const customerLocationManagerEndpoint = restApi.addResourceWithAbsolutePath(`${customerLocationUrlBase}`)
    const customerLocationManagerWithIdEndpoint = restApi.addResourceWithAbsolutePath(
      `${customerLocationUrlBase}/{customerLocationId}`,
    )

    const customerLocationManagerLambda = new CustomerLocationManagerLambda(restApi, 'CustomerLocationManagerLambda', {
      dependencies: {
        customerLocations,
        lambdaUtilsLayer,
      },
    })

    common_lambda.registerManagerFunction({
      restApi,
      endpoint: customerLocationManagerEndpoint,
      withIdEndpoint: customerLocationManagerWithIdEndpoint,
      lambdaFunction: customerLocationManagerLambda,
      methodOptions: authorizerMethodOpt,
    })

    // DISTANCE CACHE  --------------------------------------------------------------------------------------------
    const distCacheQueryEndpoint = restApi.addResourceWithAbsolutePath(`${distCacheUrlBase}`)
    const distCacheQueryWithIdEndpoint = restApi.addResourceWithAbsolutePath(`${distCacheUrlBase}/{distCacheId}`)

    const distCacheQueryLambda = new DistanceCacheQueryLambda(restApi, 'DistanceCacheQueryLambda', {
      dependencies: {
        distCache,
        lambdaUtilsLayer,
      },
    })

    common_lambda.registerManagerFunction({
      restApi,
      endpoint: distCacheQueryEndpoint,
      withIdEndpoint: distCacheQueryWithIdEndpoint,
      lambdaFunction: distCacheQueryLambda,
      methodOptions: authorizerMethodOpt,
    })

    // REBUILD DISTANCE CACHE  ------------------------------------------------------------------------------------------------------
    const rebuildDistanceCacheEndpoint = restApi.addResourceWithAbsolutePath(`${rebuildDistanceCacheUrlBase}`)
    const rebuildDistanceCacheWithIdEndpoint = restApi.addResourceWithAbsolutePath(`${rebuildDistanceCacheUrlBase}/{warehouseCode}`)
    const rebuildDistanceCacheLambda = new RebuildDistanceCacheLambda(restApi, 'RebuildDistanceCacheLambda', {
      dependencies: {
        region,
        account,
        keyBucket: parameterStoreKeys.distanceCacheBucket,
        keyLocTable: parameterStoreKeys.customerLocationsTableName,
        keyCacheTable: parameterStoreKeys.distanceCacheTableName,
        keyCluster: parameterStoreKeys.distanceCacheClusterName,
        keyCapacityProvider: parameterStoreKeys.distanceCacheAsgCapacityProvider,
        keyContainer: parameterStoreKeys.distanceCacheContainerName,
        keyTaskDef: parameterStoreKeys.distanceCacheTaskDefArn,
        lambdaUtilsLayer,
      },
    })

    common_lambda.registerManagerFunction({
      restApi,
      endpoint: rebuildDistanceCacheEndpoint,
      withIdEndpoint: rebuildDistanceCacheWithIdEndpoint,
      lambdaFunction: rebuildDistanceCacheLambda,
      methodOptions: authorizerMethodOpt,
      allowMethods: { withIdGet: true, post: false, delete: false, put: false }
    })

    // WAREHOUSES  --------------------------------------------------------------------------------------------
    const warehouseManagerEndpoint = restApi.addResourceWithAbsolutePath(`${warehouseUrlBase}`)
    const warehouseManagerWithIdEndpoint = restApi.addResourceWithAbsolutePath(`${warehouseUrlBase}/{warehouseId}`)

    const warehouseManagerLambda = new WarehouseManagerLambda(restApi, 'WarehouseManagerLambda', {
      dependencies: {
        warehouses,
        lambdaUtilsLayer,
      },
    })

    common_lambda.registerManagerFunction({
      restApi,
      endpoint: warehouseManagerEndpoint,
      withIdEndpoint: warehouseManagerWithIdEndpoint,
      lambdaFunction: warehouseManagerLambda,
      methodOptions: authorizerMethodOpt,
    })

    // VEHICLES  ------------------------------------------------------------------------------------------------------
    const vehicleManagerEndpoint = restApi.addResourceWithAbsolutePath(`${vehiclesUrlBase}`)
    const vehicleManagerWithIdEndpoint = restApi.addResourceWithAbsolutePath(`${vehiclesUrlBase}/{vehicleManagerId}`)

    const vehicleManagerManagerLambda = new VehicleManagerLambda(restApi, 'VehicleManagerLambda', {
      dependencies: {
        vehicles,
        lambdaUtilsLayer,
      },
    })

    common_lambda.registerManagerFunction({
      restApi,
      endpoint: vehicleManagerEndpoint,
      withIdEndpoint: vehicleManagerWithIdEndpoint,
      lambdaFunction: vehicleManagerManagerLambda,
      methodOptions: authorizerMethodOpt,
    })

    // SOLVER JOBS  ------------------------------------------------------------------------------------------------------
    const solverJobQueryEndpoint = restApi.addResourceWithAbsolutePath(`${solverJobsUrlBase}`)
    const solverJobQueryWithIdEndpoint = restApi.addResourceWithAbsolutePath(`${solverJobsUrlBase}/{solverJobId}`)

    const solverJobQueryManagerLambda = new SolverJobQueryLambda(restApi, 'SolverJobQueryLambda', {
      dependencies: {
        solverJobs,
        lambdaUtilsLayer,
      },
    })

    common_lambda.registerManagerFunction({
      restApi,
      endpoint: solverJobQueryEndpoint,
      withIdEndpoint: solverJobQueryWithIdEndpoint,
      lambdaFunction: solverJobQueryManagerLambda,
      methodOptions: authorizerMethodOpt,
      allowMethods: common_lambda.AllowAllMethods,
    })

    // DELIVERY JOB JOBS  ------------------------------------------------------------------------------------------------------
    const deliveryJobQueryEndpoint = restApi.addResourceWithAbsolutePath(`${deliveryJobsUrlBase}`)
    const deliveryJobQueryWithIdEndpoint = restApi.addResourceWithAbsolutePath(`${deliveryJobsUrlBase}/{deliveryJobId}`)

    const deliveryJobQueryManagerLambda = new DeliveryJobQueryLambda(restApi, 'DeliveryJobQueryLambda', {
      dependencies: {
        deliveryJobs,
        lambdaUtilsLayer,
      },
    })

    common_lambda.registerManagerFunction({
      restApi,
      endpoint: deliveryJobQueryEndpoint,
      withIdEndpoint: deliveryJobQueryWithIdEndpoint,
      lambdaFunction: deliveryJobQueryManagerLambda,
      methodOptions: authorizerMethodOpt,
      allowMethods: common_lambda.AllowAllMethods,
    })

    // DELIVERY JOB BY SOLVER JOB ID  ------------------------------------------------------------------------------------------------------
    const deliveryJobBySolverJobQueryEndpoint = restApi.addResourceWithAbsolutePath(`${deliveryJobSolverJobsUrlBase}`)
    const deliveryJobBySolverJobQueryWithIdEndpoint = restApi.addResourceWithAbsolutePath(
      `${deliveryJobSolverJobsUrlBase}/{deliveryJobBySolverJobId}`,
    )

    const deliveryJobSolverJobQueryManagerLambda = new DeliveryJobSolverJobQueryLambda(
      restApi,
      'DeliveryJobSolverJobQueryLambda',
      {
        dependencies: {
          deliveryJobs,
          lambdaUtilsLayer,
        },
      },
    )

    common_lambda.registerManagerFunction({
      restApi,
      endpoint: deliveryJobBySolverJobQueryEndpoint,
      withIdEndpoint: deliveryJobBySolverJobQueryWithIdEndpoint,
      lambdaFunction: deliveryJobSolverJobQueryManagerLambda,
      methodOptions: authorizerMethodOpt,
      allowMethods: common_lambda.AllowAllMethods,
    })

    // ORDERS  ------------------------------------------------------------------------------------------------------
    const orderQueryEndpoint = restApi.addResourceWithAbsolutePath(`${ordersUrlBase}`)
    const orderQueryWithIdEndpoint = restApi.addResourceWithAbsolutePath(`${ordersUrlBase}/{orderId}`)

    const orderQueryManagerLambda = new OrderQueryLambda(restApi, 'OrderQueryLambda', {
      dependencies: {
        orders,
        lambdaUtilsLayer,
      },
    })

    common_lambda.registerManagerFunction({
      restApi,
      endpoint: orderQueryEndpoint,
      withIdEndpoint: orderQueryWithIdEndpoint,
      lambdaFunction: orderQueryManagerLambda,
      methodOptions: authorizerMethodOpt,
      allowMethods: common_lambda.AllowAllMethods,
    })
  }
}
