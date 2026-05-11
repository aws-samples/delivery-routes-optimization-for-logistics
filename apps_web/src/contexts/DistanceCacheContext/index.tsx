/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import type { DistanceCacheData } from '../../models'
import type { QueryService } from '../../services/base/queryService'
import { createQueryProvider, useQueryContext } from '../base/QueryContext'
import type { ContextInterface } from '../base/QueryContext'
import { appvars } from '../../config'
import DistanceCacheService from '../../services/distance-cache'

const DistanceCacheProvider = createQueryProvider<DistanceCacheData, QueryService<DistanceCacheData>>(
  appvars.ENTITY.DISTANCE_CACHE,
  DistanceCacheService,
)
const useDistanceCacheContext = (): ContextInterface<DistanceCacheData> =>
  useQueryContext<DistanceCacheData>(appvars.ENTITY.DISTANCE_CACHE)

export { DistanceCacheProvider, useDistanceCacheContext }
