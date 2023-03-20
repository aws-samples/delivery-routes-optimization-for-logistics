/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { BackendStackProps } from '../lib/BackendStack'
import { PersistentBackendStackProps } from '../lib/PersistentStack'
import { OrderUploadStackProps } from '../lib/OrderUploadStack'
import { InstanceOptionStackProps } from '../lib/common/InstanceOptionStackProps'

export type RootConfig = Omit<
  PersistentBackendStackProps & BackendStackProps & OrderUploadStackProps & InstanceOptionStackProps,
  'persistent' | 'backend'
>

export default RootConfig
