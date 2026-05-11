import { App } from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import { PersistentBackendStack } from '../../src/stacks/PersistentBackendStack'
import { OptimizationEngineStack } from '../../src/stacks/OptimizationEngineStack'
import { createDummyAssets, cleanupDummyAssets, type DummyAssetPaths } from '../_helpers/assets'

const TEST_NAMESPACE = 'testns'

let dummyAssets: DummyAssetPaths

beforeAll(() => {
  dummyAssets = createDummyAssets('optimization-engine-stack-')
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

  const optEngine = new OptimizationEngineStack(app, 'TestOptEngine', {
    env: { account: '123456789012', region: 'us-east-1' },
    stackName: `${TEST_NAMESPACE}-OptimizationEngine`,
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
    vpc: persistent.vpc,
  })

  return { app, persistent, optEngine }
}

describe('OptimizationEngineStack', () => {
  describe('Resource count verification', () => {
    it('should have exactly 1 ECS Cluster', () => {
      const { optEngine } = createTestStacks()
      const template = Template.fromStack(optEngine)
      template.resourceCountIs('AWS::ECS::Cluster', 1)
    })

    it('should have exactly 1 ECS TaskDefinition', () => {
      const { optEngine } = createTestStacks()
      const template = Template.fromStack(optEngine)
      template.resourceCountIs('AWS::ECS::TaskDefinition', 1)
    })

    it('should have 4 SSM Parameters', () => {
      const { optEngine } = createTestStacks()
      const template = Template.fromStack(optEngine)
      template.resourceCountIs('AWS::SSM::Parameter', 4)
    })
  })

  describe('Fargate configuration', () => {
    it('should use Fargate compatibility', () => {
      const { optEngine } = createTestStacks()
      const template = Template.fromStack(optEngine)
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        RequiresCompatibilities: ['FARGATE'],
      })
    })
  })

  describe('SSM Parameter names', () => {
    it('should register cluster name parameter', () => {
      const { optEngine } = createTestStacks()
      const template = Template.fromStack(optEngine)
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: '/Test/ECS/OptEngine/ClusterName',
      })
    })

    it('should register capacity provider parameter', () => {
      const { optEngine } = createTestStacks()
      const template = Template.fromStack(optEngine)
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: '/Test/ECS/OptEngine/AsgCapacityProvider',
      })
    })

    it('should register task definition ARN parameter', () => {
      const { optEngine } = createTestStacks()
      const template = Template.fromStack(optEngine)
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: '/Test/ECS/OptEngine/TaskDefArn',
      })
    })

    it('should register container name parameter', () => {
      const { optEngine } = createTestStacks()
      const template = Template.fromStack(optEngine)
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: '/Test/ECS/OptEngine/ContainerName',
      })
    })
  })
})
