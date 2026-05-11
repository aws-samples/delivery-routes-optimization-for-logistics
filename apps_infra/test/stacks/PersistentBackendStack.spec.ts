import { App } from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import { PersistentBackendStack } from '../../src/stacks/PersistentBackendStack'
import { createDummyAssets, cleanupDummyAssets, type DummyAssetPaths } from '../_helpers/assets'

const TEST_NAMESPACE = 'testns'

let dummyAssets: DummyAssetPaths

beforeAll(() => {
  dummyAssets = createDummyAssets('persistent-backend-stack-')
})

afterAll(() => {
  cleanupDummyAssets(dummyAssets)
})

function createTestStack() {
  const app = new App()
  const stack = new PersistentBackendStack(app, 'TestPersistent', {
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
  return { app, stack }
}

describe('PersistentBackendStack', () => {
  describe('Resource count verification', () => {
    it('should have at least 2 S3 buckets', () => {
      const { stack } = createTestStack()
      const template = Template.fromStack(stack)
      const buckets = Object.keys(template.findResources('AWS::S3::Bucket')).length
      expect(buckets).toBeGreaterThanOrEqual(2)
    })

    it('should have exactly 7 DynamoDB tables', () => {
      const { stack } = createTestStack()
      const template = Template.fromStack(stack)
      template.resourceCountIs('AWS::DynamoDB::Table', 7)
    })

    it('should have exactly 1 Cognito UserPool', () => {
      const { stack } = createTestStack()
      const template = Template.fromStack(stack)
      template.resourceCountIs('AWS::Cognito::UserPool', 1)
    })

    it('should have exactly 1 CloudFront Distribution', () => {
      const { stack } = createTestStack()
      const template = Template.fromStack(stack)
      template.resourceCountIs('AWS::CloudFront::Distribution', 1)
    })
  })

  describe('Property 5: CfnOutput exportName namespace rule', () => {
    /**
     * **Validates: Requirements 5.8, 12.4**
     * All CfnOutput.exportName values must start with `${namespace}-`
     */
    it('all CfnOutput exportNames start with namespace prefix', () => {
      const { stack } = createTestStack()
      const template = Template.fromStack(stack)
      const outputs = template.findOutputs('*')

      for (const [, output] of Object.entries(outputs)) {
        if (output.Export && output.Export.Name) {
          const exportName = output.Export.Name
          if (typeof exportName === 'string') {
            expect(exportName).toMatch(new RegExp(`^${TEST_NAMESPACE}-`))
          }
        }
      }
    })
  })

  describe('Property 8: S3 encryption invariant', () => {
    /**
     * **Validates: Requirements 14.1, 16.2**
     * All S3 buckets must have AES256 (S3_MANAGED) encryption
     */
    it('all S3 buckets have AES256 encryption', () => {
      const { stack } = createTestStack()
      const template = Template.fromStack(stack)
      const buckets = template.findResources('AWS::S3::Bucket')

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
  })
})
