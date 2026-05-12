import * as fs from 'node:fs'
import * as path from 'node:path'

/**
 * **Property 7: Handler entry file existence**
 * **Validates: Requirements 3.6, 10.1, 12.7**
 *
 * All 13 Lambda handler entry files must exist on disk.
 */
describe('Lambda handler entry file existence', () => {
  const LAMBDA_ROOT = path.resolve(process.cwd(), 'lambda')

  const HANDLER_PATHS = [
    // api-web (10 handlers)
    'api-web/customer-location-manager/index.ts',
    'api-web/warehouse-manager/index.ts',
    'api-web/vehicle-manager/index.ts',
    'api-web/orders-query/index.ts',
    'api-web/solver-job-query/index.ts',
    'api-web/delivery-jobs-query/index.ts',
    'api-web/delivery-job-by-solver-job-query/index.ts',
    'api-web/distance-cache-query/index.ts',
    'api-web/rebuild-distance-cache/index.ts',
    'api-web/get-s3-presigned-url/index.ts',
    // api-order (3 handlers)
    'api-order/get-s3-presigned-url/index.ts',
    'api-order/create-order-batch/index.ts',
    'api-order/start-order-dispatch-task/index.ts',
  ]

  it.each(HANDLER_PATHS)('handler entry exists: %s', (handlerPath) => {
    const fullPath = path.join(LAMBDA_ROOT, handlerPath)
    expect(fs.existsSync(fullPath)).toBe(true)
  })
})
