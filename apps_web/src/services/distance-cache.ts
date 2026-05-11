/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import type { DistanceCacheData } from '../models'
import { QueryService } from './base/queryService'
import { appvars } from '../config'

const DistanceCacheService = new QueryService<DistanceCacheData>('distance-cache', appvars.ENDPOINT.DISTANCE_CACHE, {})

export default DistanceCacheService
