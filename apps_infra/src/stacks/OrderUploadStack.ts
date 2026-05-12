/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */
import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib'
import * as apigw from 'aws-cdk-lib/aws-apigateway'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as s3n from 'aws-cdk-lib/aws-s3-notifications'
import * as ssm from 'aws-cdk-lib/aws-ssm'
import { Construct } from 'constructs'
import { RootConfig } from '../config'
import { setNamespace, namespacedBucket, namespaced } from '../utils/namespace'
import { AppNodejsFunction } from '../constructs/NodejsFn'
import { PolicyStatements } from '../utils/policies'
import { PersistentBackendStack } from './PersistentBackendStack'

export interface OrderUploadStackProps extends StackProps, Omit<RootConfig, 'env'> {
  readonly persistent: PersistentBackendStack
}

export class OrderUploadStack extends Stack {
  constructor(scope: Construct, id: string, props: OrderUploadStackProps) {
    super(scope, id, props)

    setNamespace(this, props.namespace)

    const { persistent, parameterStoreKeys } = props

    // --- S3 Bucket for order uploads ---
    const uploadBucket = new s3.Bucket(this, 'OrderUploadsBucket', {
      bucketName: namespacedBucket(this, 'order-uploads'),
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    })

    // --- REST API ---
    const restApi = new apigw.RestApi(this, 'RestApi-Order', {
      restApiName: namespaced(this, 'OrderApi'),
      defaultCorsPreflightOptions: {
        allowOrigins: apigw.Cors.ALL_ORIGINS,
        allowMethods: apigw.Cors.ALL_METHODS,
      },
    })

    // API Key auth
    const apiKey = new apigw.ApiKey(this, 'OrderApiKey', {
      apiKeyName: namespaced(this, 'OrderApiKey'),
      enabled: true,
    })

    const usagePlan = new apigw.UsagePlan(this, 'OrderUsagePlan', {
      name: namespaced(this, 'OrderUsagePlan'),
      apiStages: [{ api: restApi, stage: restApi.deploymentStage }],
    })
    usagePlan.addApiKey(apiKey)

    const apiKeyMethodOptions: apigw.MethodOptions = {
      apiKeyRequired: true,
    }

    // --- Lambda: get-s3-presigned-url ---
    const presignedUrlFn = new AppNodejsFunction(this, 'GetS3PresignedUrl', {
      handlerPath: 'api-order/get-s3-presigned-url/index.ts',
      environment: {
        BUCKET_NAME: uploadBucket.bucketName,
      },
    })
    uploadBucket.grantPut(presignedUrlFn)

    // --- Lambda: start-order-dispatch-task ---
    const dispatchFn = new AppNodejsFunction(this, 'StartOrderDispatchTask', {
      handlerPath: 'api-order/start-order-dispatch-task/index.ts',
      environment: {
        SSM_CLUSTER: parameterStoreKeys.optEngineClusterName,
        SSM_CONTAINER: parameterStoreKeys.optEngineContainerName,
        SSM_TASK_DEF: parameterStoreKeys.optEngineTaskDefArn,
        SSM_VPC_ID: parameterStoreKeys.commonVpcId,
      },
    })
    dispatchFn.addToRolePolicy(PolicyStatements.ssm.readParams(this.region, this.account))
    dispatchFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['ecs:RunTask', 'iam:PassRole'],
        resources: ['*'],
      }),
    )
    dispatchFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['ec2:DescribeSubnets'],
        resources: ['*'],
      }),
    )

    // --- Lambda: create-order-batch ---
    const batchFn = new AppNodejsFunction(this, 'CreateOrderBatch', {
      handlerPath: 'api-order/create-order-batch/index.ts',
      environment: {
        TABLE_NAME: persistent.orders.tableName,
        DISPATCH_LAMBDA_ARN: dispatchFn.functionArn,
      },
    })
    persistent.orders.grantWriteData(batchFn)
    uploadBucket.grantRead(batchFn)
    dispatchFn.grantInvoke(batchFn)

    // S3 event notification → create-order-batch
    uploadBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(batchFn),
    )

    // --- API Routes ---
    // /upload/url (GET, API key required)
    const uploadResource = restApi.root.addResource('upload')
    const urlResource = uploadResource.addResource('url')
    urlResource.addMethod('GET', new apigw.LambdaIntegration(presignedUrlFn), apiKeyMethodOptions)

    // /dispatch (POST)
    const dispatchResource = restApi.root.addResource('dispatch')
    dispatchResource.addMethod('POST', new apigw.LambdaIntegration(dispatchFn), apiKeyMethodOptions)

    // --- SSM Parameters for API URL and Key ---
    new ssm.StringParameter(this, 'OrderUploadApiUrlParam', {
      parameterName: parameterStoreKeys.orderUploadApiUrl,
      stringValue: restApi.url,
    })

    new ssm.StringParameter(this, 'OrderUploadApiKeyParam', {
      parameterName: parameterStoreKeys.orderUploadApiKey,
      stringValue: apiKey.keyId,
    })
  }
}
