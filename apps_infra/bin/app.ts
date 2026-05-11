#!/usr/bin/env node
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import 'source-map-support/register'
import { App } from 'aws-cdk-lib'
import { loadConfig } from '../src/config'
import { PersistentBackendStack } from '../src/stacks/PersistentBackendStack'
import { BackendStack } from '../src/stacks/BackendStack'
import { OrderUploadStack } from '../src/stacks/OrderUploadStack'
import { DistanceCacheStack } from '../src/stacks/DistanceCacheStack'
import { OptimizationEngineStack } from '../src/stacks/OptimizationEngineStack'

const app = new App()
const config = loadConfig()
const env = { account: config.env.account, region: config.env.region }

const { env: _env, ...configRest } = config

const persistent = new PersistentBackendStack(app, 'Dev-PersistentBackend', {
  env,
  stackName: `${config.namespace}-PersistentBackend`,
  description: 'Persistent Stack for RETAIN resources',
  ...configRest,
})

const backend = new BackendStack(app, 'Dev-Backend', {
  env,
  stackName: `${config.namespace}-Backend`,
  description: 'Backend Stack',
  persistent,
  ...configRest,
})
backend.addDependency(persistent)

const orderUpload = new OrderUploadStack(app, 'Dev-OrderUpload', {
  env,
  stackName: `${config.namespace}-OrderUpload`,
  description: 'OrderUpload Stack',
  persistent,
  ...configRest,
})
orderUpload.addDependency(persistent)

const distanceCache = new DistanceCacheStack(app, 'Dev-DistanceCache', {
  env,
  stackName: `${config.namespace}-DistanceCache`,
  description: 'DistanceCache Stack',
  vpc: persistent.vpc,
  ...configRest,
})
distanceCache.addDependency(persistent)

const optEngine = new OptimizationEngineStack(app, 'Dev-OptEngine', {
  env,
  stackName: `${config.namespace}-OptimizationEngine`,
  description: 'OptimizationEngine Stack',
  vpc: persistent.vpc,
  ...configRest,
})
optEngine.addDependency(persistent)

app.synth()
