#!/usr/bin/env node

/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import 'source-map-support/register'
import * as core from 'aws-cdk-lib'
import config from '../config'
import { PersistentBackendStack } from '../lib/PersistentStack'
import { BackendStack } from '../lib/BackendStack'
import { OrderUploadStack } from '../lib/OrderUploadStack'
import { DistanceCacheStack } from '../lib/DistanceCacheStack'
import { OptimizationEngineStack } from '../lib/OptimizationEngineStack'

const app = new core.App()

const persistentBackendStack = new PersistentBackendStack(app, 'Dev-PersistentBackend', {
  stackName: `${config.namespace}-PersistentBackend`,
  description: 'Persistent Stack for RETAIN resources',
  ...config,
})

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const backendStack = new BackendStack(app, 'Dev-Backend', {
  stackName: `${config.namespace}-Backend`,
  persistent: persistentBackendStack,
  description: 'Backend Stack',
  ...config,
})

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const orderUploadStack = new OrderUploadStack(app, 'Dev-OrderUpload', {
  stackName: `${config.namespace}-OrderUpload`,
  description: 'OrderUpload Stack',
  ...config,
})
orderUploadStack.addDependency(persistentBackendStack)

const distanceCacheStack = new DistanceCacheStack(app, 'Dev-DistanceCache', {
  stackName: `${config.namespace}-DistanceCache`,
  description: 'DistanceCache Stack',
  vpc: persistentBackendStack.vpc,
  ...config,
})
distanceCacheStack.addDependency(persistentBackendStack)

const optimizationEngineStack = new OptimizationEngineStack(app, 'Dev-OptEngine', {
  stackName: `${config.namespace}-OptimizationEngine`,
  description: 'OptimizationEngineStack',
  vpc: persistentBackendStack.vpc,
  ...config,
})
optimizationEngineStack.addDependency(persistentBackendStack)
