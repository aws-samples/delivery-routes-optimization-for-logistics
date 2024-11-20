/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { Construct } from 'constructs'
import {
  aws_apigateway as apigw,
  aws_dynamodb as ddb,
  aws_s3 as s3,
  aws_s3_notifications as s3n,
  aws_ssm as ssm,
  aws_lambda_event_sources as lambda_event,
} from 'aws-cdk-lib'
import { namespaced, namespacedBucket, common_apigw, common_lambda } from '@aws-samples/common'
import { HTTPMethod } from 'http-method-enum'
import { GetS3PresignedUrlLambda } from './GetS3PresignedUrl'
import { CreateOrderBatchLambda } from './CreateOrderBatch'
import { StartOrderDispatchTaskLambda } from './StartOrderDispatchTask'
import { v4 } from 'uuid'
import { AccountPrincipal } from 'aws-cdk-lib/aws-iam'

export interface ApiOrderProps {
  readonly region: string
  readonly account: string
  readonly apiPrefix?: string
  readonly orders: ddb.ITable
  readonly parameterStoreKeys: Record<string, string>
}

export class ApiOrder extends Construct {
  readonly restApi: common_apigw.RestApi

  readonly orderUploadsBucket: s3.Bucket

  public readonly ssmStringParameters: Record<string, ssm.IStringParameter>

  constructor(scope: Construct, id: string, props: ApiOrderProps) {
    super(scope, id)

    this.ssmStringParameters = {}

    const { apiPrefix = 'api/order', orders, parameterStoreKeys, region, account } = props

    const ordersUrlBase = `${apiPrefix}/upload`

    // TODO: Add WAF
    const restApi = new common_apigw.RestApi(this, 'RestApi-Order', {
      restApiName: namespaced(this, 'OrderApi'),
      defaultCorsPreflightOptions: {
        allowOrigins: apigw.Cors.ALL_ORIGINS,
        allowMethods: apigw.Cors.ALL_METHODS,
      },
    })
    this.restApi = restApi

    // API KEY
    const plan = restApi.addUsagePlan('OrderUploadApiUsagePlan', {
      name: 'OrderUploadApi',
      description: 'For Order File Upload',
      throttle: {
        burstLimit: 5,
        rateLimit: 10,
      },
      quota: {
        limit: 1000,
        period: apigw.Period.DAY,
      },
    })
    const apiKey = 'ns-order-upload-key-' + parameterStoreKeys.orderUploadApiKeySufffix
    const normalUserKey = restApi.addApiKey('ApiKey', {
      apiKeyName: 'order-upload-api-key',
      value: apiKey,
    })
    plan.addApiKey(normalUserKey)

    // SAVE KEY INFO TO SSM
    this.addToSsmStringParameters(
      'order-upload-api-url',
      parameterStoreKeys.orderUploadApiUrl,
      restApi.url,
      'order-upload-api-url',
    )
    this.addToSsmStringParameters(
      'order-upload-api-key',
      parameterStoreKeys.orderUploadApiKey,
      apiKey,
      'order-upload-api-key',
    )

    // ORDER UPLOADS BUCKET -------------------------------------------------------------------------------------------
    this.orderUploadsBucket = new s3.Bucket(this, 'OrderUploadsBucket', {
      bucketName: namespacedBucket(this, 'order-uploads'),
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    })

    this.addToSsmStringParameters(
      'orders-bucket-param',
      parameterStoreKeys.ordersBucketName,
      this.orderUploadsBucket.bucketName,
      'Orders bucket name',
    )

    const { lambdaUtilsLayer } = new common_lambda.LambdaUtilsLayer(this, 'LambdaUtilsLayer', {})

    // ENDPOINTS and HANDLERS
    const getS3PresignedUrlEndpoint = restApi.addResourceWithAbsolutePath(`${ordersUrlBase}/get-presigned-url`)
    const getS3PresignedUrlLambda = new GetS3PresignedUrlLambda(restApi, 'GetS3PresignedUrlLambda', {
      dependencies: {
        bucket: this.orderUploadsBucket,
        lambdaUtilsLayer,
      },
    })

    restApi.addFunctionToResource(getS3PresignedUrlEndpoint, {
      function: getS3PresignedUrlLambda,
      httpMethod: HTTPMethod.POST,
    })

    // ORDER DISPATCH LAMBDA - for run ecs task
    const orderDispatchLambda = new StartOrderDispatchTaskLambda(this, 'StartOrderDispatchTaskLambda', {
      dependencies: {
        region,
        account,
        keyCluster: parameterStoreKeys.optEngineClusterName,
        keyCapacityProvider: parameterStoreKeys.optEngineAsgCapacityProvider,
        keyContainer: parameterStoreKeys.optEngineContainerName,
        keyTaskDef: parameterStoreKeys.optEngineTaskDefArn,
        lambdaUtilsLayer,
      },
    })

    // UPLOAD LAMBDA BATCH
    const createOrderBatchLambda = new CreateOrderBatchLambda(this, 'CreateOrderBatchLambda', {
      dependencies: {
        account,
        orderDispatchLambdaName: orderDispatchLambda.functionName,
        bucket: this.orderUploadsBucket,
        table: orders,
        lambdaUtilsLayer,
      },
    })

    createOrderBatchLambda.addEventSource(
      new lambda_event.S3EventSource(this.orderUploadsBucket, { events: [s3.EventType.OBJECT_CREATED] }),
    )
  }

  addToSsmStringParameters(resourceId: string, paramName: string, paramValue: string, descriptionKey: string): void {
    this.ssmStringParameters[paramName] = new ssm.StringParameter(this, resourceId, {
      parameterName: paramName,
      stringValue: paramValue,
      description: `${descriptionKey} parameter for order upload`,
    })
  }
}
