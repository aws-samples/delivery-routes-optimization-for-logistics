import { Duration } from 'aws-cdk-lib'
import { Runtime } from 'aws-cdk-lib/aws-lambda'

export const LAMBDA_RUNTIME = Runtime.NODEJS_24_X

export const LAMBDA_DEFAULTS = {
  runtime: LAMBDA_RUNTIME,
  memorySize: 256,
  timeout: Duration.seconds(10),
  architecture: undefined,
} as const

export const STACK_IDS = {
  persistent: 'Dev-PersistentBackend',
  backend: 'Dev-Backend',
  orderUpload: 'Dev-OrderUpload',
  distanceCache: 'Dev-DistanceCache',
  optEngine: 'Dev-OptEngine',
} as const
