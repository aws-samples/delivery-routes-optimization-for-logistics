import { App, Stack } from 'aws-cdk-lib'
import { PersistentBackendStack } from '../../src/stacks/PersistentBackendStack'
import { BackendStack } from '../../src/stacks/BackendStack'
import { OrderUploadStack } from '../../src/stacks/OrderUploadStack'
import { DistanceCacheStack } from '../../src/stacks/DistanceCacheStack'
import { OptimizationEngineStack } from '../../src/stacks/OptimizationEngineStack'
import { createDummyAssets, cleanupDummyAssets, type DummyAssetPaths } from '../_helpers/assets'

const TEST_NAMESPACE = 'testns'

let dummyAssets: DummyAssetPaths

beforeAll(() => {
  dummyAssets = createDummyAssets('stack-set-')
})

afterAll(() => {
  cleanupDummyAssets(dummyAssets)
})

const testConfig = {
  namespace: TEST_NAMESPACE,
  administratorEmail: 'admin@example.com',
  administratorName: 'Admin',
  fargateOptions: {
    distCacheCpu: 4096,
    distCacheMemory: 8192,
    distCacheArchitecture: 'arm64' as const,
    optEngineCpu: 4096,
    optEngineMemory: 8192,
    optEngineArchitecture: 'arm64' as const,
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
}

const env = { account: '123456789012', region: 'us-east-1' }

function createAllStacks() {
  const app = new App()

  // `assets` is injected at call time because dummyAssets is created in beforeAll
  const assets = {
    websiteBundlePath: dummyAssets.websiteBundlePath,
    distanceCacheDockerPath: dummyAssets.distanceCacheDockerPath,
    optEngineDockerPath: dummyAssets.optEngineDockerPath,
  }

  const persistent = new PersistentBackendStack(app, 'Dev-PersistentBackend', {
    env,
    stackName: `${TEST_NAMESPACE}-PersistentBackend`,
    description: 'Persistent Stack for RETAIN resources',
    ...testConfig,
    assets,
  })

  const backend = new BackendStack(app, 'Dev-Backend', {
    env,
    stackName: `${TEST_NAMESPACE}-Backend`,
    description: 'Backend Stack',
    persistent,
    ...testConfig,
    assets,
  })
  backend.addDependency(persistent)

  const orderUpload = new OrderUploadStack(app, 'Dev-OrderUpload', {
    env,
    stackName: `${TEST_NAMESPACE}-OrderUpload`,
    description: 'OrderUpload Stack',
    persistent,
    ...testConfig,
    assets,
  })
  orderUpload.addDependency(persistent)

  const distanceCache = new DistanceCacheStack(app, 'Dev-DistanceCache', {
    env,
    stackName: `${TEST_NAMESPACE}-DistanceCache`,
    description: 'DistanceCache Stack',
    vpc: persistent.vpc,
    ...testConfig,
    assets,
  })
  distanceCache.addDependency(persistent)

  const optEngine = new OptimizationEngineStack(app, 'Dev-OptEngine', {
    env,
    stackName: `${TEST_NAMESPACE}-OptimizationEngine`,
    description: 'OptimizationEngine Stack',
    vpc: persistent.vpc,
    ...testConfig,
    assets,
  })
  optEngine.addDependency(persistent)

  return { app, persistent, backend, orderUpload, distanceCache, optEngine }
}

describe('Property 3: Stack set resource-count invariant', () => {
  /**
   * **Validates: Requirements 4.2, 4.3, 4.4, 4.7**
   * The app produces exactly 5 top-level stacks with correct names.
   */
  it('produces exactly 5 top-level stacks with correct names', () => {
    const { app } = createAllStacks()
    const assembly = app.synth()

    // Filter to top-level stacks only (exclude nested stacks)
    const topLevelStacks = assembly.stacks.filter(
      (s) => !s.id.includes('/'),
    )

    expect(topLevelStacks.length).toBe(5)

    const expectedNames = [
      `${TEST_NAMESPACE}-PersistentBackend`,
      `${TEST_NAMESPACE}-Backend`,
      `${TEST_NAMESPACE}-OrderUpload`,
      `${TEST_NAMESPACE}-DistanceCache`,
      `${TEST_NAMESPACE}-OptimizationEngine`,
    ]

    const actualNames = topLevelStacks.map((s) => s.stackName).sort()
    expect(actualNames).toEqual(expectedNames.sort())
  })
})

describe('Property 6: Stack dependency acyclicity', () => {
  /**
   * **Validates: Requirements 4.4, 6.8, 7.6, 9.5**
   * All non-persistent stacks depend on PersistentBackend.
   */
  it('all non-persistent stacks depend on persistent', () => {
    const { persistent, backend, orderUpload, distanceCache, optEngine } = createAllStacks()

    const dependsOnPersistent = (stack: Stack) =>
      stack.dependencies.some((dep) => dep.node.id === persistent.node.id)

    expect(dependsOnPersistent(backend)).toBe(true)
    expect(dependsOnPersistent(orderUpload)).toBe(true)
    expect(dependsOnPersistent(distanceCache)).toBe(true)
    expect(dependsOnPersistent(optEngine)).toBe(true)
  })

  it('no circular dependencies exist', () => {
    const { persistent, backend, orderUpload, distanceCache, optEngine } = createAllStacks()
    const stacks = [persistent, backend, orderUpload, distanceCache, optEngine]

    // Build adjacency list from dependencies
    const adj = new Map<string, string[]>()
    for (const stack of stacks) {
      adj.set(stack.node.id, stack.dependencies.map((d) => d.node.id))
    }

    // DFS cycle detection
    const visited = new Set<string>()
    const inStack = new Set<string>()

    function hasCycle(nodeId: string): boolean {
      if (inStack.has(nodeId)) return true
      if (visited.has(nodeId)) return false

      visited.add(nodeId)
      inStack.add(nodeId)

      for (const dep of adj.get(nodeId) ?? []) {
        if (hasCycle(dep)) return true
      }

      inStack.delete(nodeId)
      return false
    }

    for (const stack of stacks) {
      expect(hasCycle(stack.node.id)).toBe(false)
    }
  })
})
