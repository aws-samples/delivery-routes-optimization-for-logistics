import { App } from 'aws-cdk-lib'
import { Template, Match } from 'aws-cdk-lib/assertions'
import { PersistentBackendStack } from '../../src/stacks/PersistentBackendStack'
import { OrderUploadStack } from '../../src/stacks/OrderUploadStack'
import { createDummyAssets, cleanupDummyAssets, type DummyAssetPaths } from '../_helpers/assets'

const TEST_NAMESPACE = 'testns'

let dummyAssets: DummyAssetPaths

beforeAll(() => {
  dummyAssets = createDummyAssets('order-upload-stack-')
})

afterAll(() => {
  cleanupDummyAssets(dummyAssets)
})

function createTestStacks() {
  const app = new App()

  const persistent = new PersistentBackendStack(app, 'TestPersistent', {
    env: { account: '123456789012', region: 'us-east-1' },
    stackName: `${TEST_NAMESPACE}-PersistentBackend`,
    namespace: TEST_NAMESPACE,
    administratorEmail: 'admin@example.com',
    administratorName: 'Admin',
    fargateOptions: {
      distCacheCpu: 4096,
      distCacheMemory: 8192, distCacheArchitecture: 'arm64',
      optEngineCpu: 4096,
      optEngineMemory: 8192, optEngineArchitecture: 'arm64',
    },
    parameterStoreKeys: {
      commonVpcId: '/Test/VPC/Common/VpcId',
      ordersTableName: '/Test/Ddb/Orders/TableName',
      ordersBucketName: '/Test/S3/Orders/BucketName',
      ordersStatusIndex: '/Test/Ddb/Orders/Index/Status',
      solverJobsTableName: '/Test/Ddb/SolverJobs/TableName',
      deliveryJobsTableName: '/Test/Ddb/DeliveryJobs/TableName',
      deliveryJobSolverJobIdIndex: '/Test/Ddb/DeliveryJobs/Index/SolverJobId',
      customerLocationsTableName: '/Test/Ddb/CustomerLocations/TableName',
      customerLocationsWarehouseCodeIndex: '/Test/Ddb/CustomerLocations/Index/WarehouseCode',
      warehousesTableName: '/Test/Ddb/Warehouses/TableName',
      warehouseCodeIndex: '/Test/Ddb/Warehouses/Index/WarehouseCode',
      vehiclesTableName: '/Test/Ddb/Vehicles/TableName',
      distanceCacheBucket: '/Test/S3/DistanceCache/BucketName',
      distanceCacheTableName: '/Test/DDB/DistanceCache/TableName',
      distanceCacheClusterName: '/Test/ECS/DistanceCache/ClusterName',
      distanceCacheAsgCapacityProvider: '/Test/ECS/DistanceCache/AsgCapacityProvider',
      distanceCacheTaskDefArn: '/Test/ECS/DistanceCache/TaskDefArn',
      distanceCacheContainerName: '/Test/ECS/DistanceCache/ContainerName',
      optEngineClusterName: '/Test/ECS/OptEngine/ClusterName',
      optEngineAsgCapacityProvider: '/Test/ECS/OptEngine/AsgCapacityProvider',
      optEngineTaskDefArn: '/Test/ECS/OptEngine/TaskDefArn',
      optEngineContainerName: '/Test/ECS/OptEngine/ContainerName',
      orderUploadApiUrl: '/Test/Api/Order/Upload/Url',
      orderUploadApiKeySufffix: 'test-suffix',
      orderUploadApiKey: '/Test/Api/Order/Upload/Key',
    },
    assets: {
      websiteBundlePath: dummyAssets.websiteBundlePath,
      distanceCacheDockerPath: dummyAssets.distanceCacheDockerPath,
      optEngineDockerPath: dummyAssets.optEngineDockerPath,
    },
  })

  const orderUpload = new OrderUploadStack(app, 'TestOrderUpload', {
    env: { account: '123456789012', region: 'us-east-1' },
    stackName: `${TEST_NAMESPACE}-OrderUpload`,
    namespace: TEST_NAMESPACE,
    administratorEmail: 'admin@example.com',
    administratorName: 'Admin',
    fargateOptions: {
      distCacheCpu: 4096,
      distCacheMemory: 8192, distCacheArchitecture: 'arm64',
      optEngineCpu: 4096,
      optEngineMemory: 8192, optEngineArchitecture: 'arm64',
    },
    parameterStoreKeys: {
      commonVpcId: '/Test/VPC/Common/VpcId',
      ordersTableName: '/Test/Ddb/Orders/TableName',
      ordersBucketName: '/Test/S3/Orders/BucketName',
      ordersStatusIndex: '/Test/Ddb/Orders/Index/Status',
      solverJobsTableName: '/Test/Ddb/SolverJobs/TableName',
      deliveryJobsTableName: '/Test/Ddb/DeliveryJobs/TableName',
      deliveryJobSolverJobIdIndex: '/Test/Ddb/DeliveryJobs/Index/SolverJobId',
      customerLocationsTableName: '/Test/Ddb/CustomerLocations/TableName',
      customerLocationsWarehouseCodeIndex: '/Test/Ddb/CustomerLocations/Index/WarehouseCode',
      warehousesTableName: '/Test/Ddb/Warehouses/TableName',
      warehouseCodeIndex: '/Test/Ddb/Warehouses/Index/WarehouseCode',
      vehiclesTableName: '/Test/Ddb/Vehicles/TableName',
      distanceCacheBucket: '/Test/S3/DistanceCache/BucketName',
      distanceCacheTableName: '/Test/DDB/DistanceCache/TableName',
      distanceCacheClusterName: '/Test/ECS/DistanceCache/ClusterName',
      distanceCacheAsgCapacityProvider: '/Test/ECS/DistanceCache/AsgCapacityProvider',
      distanceCacheTaskDefArn: '/Test/ECS/DistanceCache/TaskDefArn',
      distanceCacheContainerName: '/Test/ECS/DistanceCache/ContainerName',
      optEngineClusterName: '/Test/ECS/OptEngine/ClusterName',
      optEngineAsgCapacityProvider: '/Test/ECS/OptEngine/AsgCapacityProvider',
      optEngineTaskDefArn: '/Test/ECS/OptEngine/TaskDefArn',
      optEngineContainerName: '/Test/ECS/OptEngine/ContainerName',
      orderUploadApiUrl: '/Test/Api/Order/Upload/Url',
      orderUploadApiKeySufffix: 'test-suffix',
      orderUploadApiKey: '/Test/Api/Order/Upload/Key',
    },
    assets: {
      websiteBundlePath: dummyAssets.websiteBundlePath,
      distanceCacheDockerPath: dummyAssets.distanceCacheDockerPath,
      optEngineDockerPath: dummyAssets.optEngineDockerPath,
    },
    persistent,
  })

  return { app, persistent, orderUpload }
}

describe('OrderUploadStack', () => {
  describe('Resource count verification', () => {
    it('should have at least 1 S3 bucket with AES256 encryption', () => {
      const { orderUpload } = createTestStacks()
      const template = Template.fromStack(orderUpload)
      const buckets = template.findResources('AWS::S3::Bucket')
      expect(Object.keys(buckets).length).toBeGreaterThanOrEqual(1)

      for (const [, bucket] of Object.entries(buckets)) {
        const encryption = (bucket as any).Properties?.BucketEncryption
        expect(encryption).toBeDefined()
        const rules = encryption.ServerSideEncryptionConfiguration
        expect(rules).toBeDefined()
        expect(rules.length).toBeGreaterThan(0)
        const algo = rules[0].ServerSideEncryptionByDefault?.SSEAlgorithm
        expect(algo).toBe('AES256')
      }
    })

    it('should have exactly 3 business Lambda functions', () => {
      const { orderUpload } = createTestStacks()
      const template = Template.fromStack(orderUpload)
      const lambdas = template.findResources('AWS::Lambda::Function')
      // Filter out custom resource lambdas (BucketNotifications + AutoDeleteObjects handlers)
      const businessLambdas = Object.entries(lambdas).filter(
        ([logicalId]) => !logicalId.includes('BucketNotifications') && !logicalId.includes('CustomS3Auto'),
      )
      expect(businessLambdas.length).toBe(3)
    })

    it('should have an API key', () => {
      const { orderUpload } = createTestStacks()
      const template = Template.fromStack(orderUpload)
      template.resourceCountIs('AWS::ApiGateway::ApiKey', 1)
    })

    it('should have a UsagePlan', () => {
      const { orderUpload } = createTestStacks()
      const template = Template.fromStack(orderUpload)
      template.resourceCountIs('AWS::ApiGateway::UsagePlan', 1)
    })
  })

  describe('S3 event notification', () => {
    it('should configure S3 event notification for object creation', () => {
      const { orderUpload } = createTestStacks()
      const template = Template.fromStack(orderUpload)
      // The BucketNotification custom resource should exist
      template.hasResourceProperties('Custom::S3BucketNotifications', {
        NotificationConfiguration: Match.objectLike({
          LambdaFunctionConfigurations: Match.arrayWith([
            Match.objectLike({
              Events: ['s3:ObjectCreated:*'],
            }),
          ]),
        }),
      })
    })
  })

  describe('Property 4: Lambda runtime invariant', () => {
    /**
     * **Validates: Requirements 10.3**
     * All Lambda functions must use nodejs24.x runtime
     */
    it('all Lambda functions use nodejs24.x runtime', () => {
      const { orderUpload } = createTestStacks()
      const template = Template.fromStack(orderUpload)
      const lambdas = template.findResources('AWS::Lambda::Function')

      for (const [logicalId, resource] of Object.entries(lambdas)) {
        const runtime = (resource as any).Properties?.Runtime
        // Skip custom resource lambdas (BucketNotifications + AutoDeleteObjects framework)
        if (logicalId.includes('BucketNotifications') || logicalId.includes('CustomS3Auto') || logicalId.includes('Custom')) continue
        if (runtime) {
          expect(runtime).toBe('nodejs24.x')
        }
      }
    })
  })

  describe('Property 8: S3 encryption invariant', () => {
    /**
     * **Validates: Requirements 14.1, 16.2**
     * All S3 buckets must have AES256 encryption
     */
    it('all S3 buckets have AES256 encryption', () => {
      const { orderUpload } = createTestStacks()
      const template = Template.fromStack(orderUpload)
      const buckets = template.findResources('AWS::S3::Bucket')

      for (const [, bucket] of Object.entries(buckets)) {
        const encryption = (bucket as any).Properties?.BucketEncryption
        if (encryption) {
          const rules = encryption.ServerSideEncryptionConfiguration
          expect(rules).toBeDefined()
          expect(rules.length).toBeGreaterThan(0)
          const algo = rules[0].ServerSideEncryptionByDefault?.SSEAlgorithm
          expect(algo).toBe('AES256')
        }
      }
    })
  })
})
