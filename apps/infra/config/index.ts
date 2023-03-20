/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

/* eslint-disable no-console */
// import { findUpSync as findUp } from 'find-up'
import RootConfig from './RootConfig'
import { sync as findUp } from 'find-up'

const CDK_CONTEXT_JSON = JSON.parse(process.env.CDK_CONTEXT_JSON || '{}')

if (CDK_CONTEXT_JSON.env) {
  const env = CDK_CONTEXT_JSON.env
  process.env.NODE_CONFIG_ENV = Array.isArray(env) ? env.join(',') : env
} else if (process.env.CDK_ENV) {
  process.env.NODE_CONFIG_ENV = process.env.CDK_ENV
}

const IS_TEST = (process.env.NODE_CONFIG_ENV || process.env.NODE_ENV || '').split(',').includes('test')

const account = process.env.CDK_DEFAULT_ACCOUNT

if (account == null && !IS_TEST) {
  throw new Error('Config failed to determine account')
}

process.env.NODE_CONFIG_DIR = findUp('config', { type: 'directory', cwd: __dirname })
process.env.NODE_APP_INSTANCE = account

if (process.env.CDK_CONFIG) {
  process.env.NODE_CONFIG = process.env.CDK_CONFIG
}

if (process.env.CDK_CONFIG_SUPPRESS_WARNING) {
  process.env.SUPPRESS_NO_CONFIG_WARNING = process.env.CDK_CONFIG_SUPPRESS_WARNING
}

export type Config = RootConfig

// eslint-disable-next-line @typescript-eslint/no-var-requires
export const config: Config = require('config')

if (process.env.CDK_CONFIG_SUPPRESS_WARNING == null) {
  console.info(config)
}

export default config
