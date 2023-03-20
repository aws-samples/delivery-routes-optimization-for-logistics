/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { DistanceCacheData } from '../../models'
import { QueryService } from '../../services/base/queryService'
import { ContextInterface, createQueryProvider, useQueryContext } from '../base/QueryContext'
import { appvars } from '../../config'
import DistanceCacheService from '../../services/distance-cache'

const DistanceCacheProvider = createQueryProvider<DistanceCacheData, QueryService<DistanceCacheData>>(
  appvars.ENTITY.DISTANCE_CACHE,
  DistanceCacheService,
)
const useDistanceCacheContext = (): ContextInterface<DistanceCacheData> =>
  useQueryContext<DistanceCacheData>(appvars.ENTITY.DISTANCE_CACHE)

export { DistanceCacheProvider, useDistanceCacheContext }
