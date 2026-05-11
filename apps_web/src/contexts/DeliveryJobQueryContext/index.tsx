/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import type { DeliveryJobData } from '../../models'
import type { QueryService } from '../../services/base/queryService'
import { createQueryProvider, useQueryContext } from '../base/QueryContext'
import type { ContextInterface } from '../base/QueryContext'
import { appvars } from '../../config'
import DeliveryJobService from '../../services/delivery-job'

const DeliveryJobQueryProvider = createQueryProvider<DeliveryJobData, QueryService<DeliveryJobData>>(
  appvars.ENTITY.DELIVERY_JOB,
  DeliveryJobService,
)
const useDeliveryJobQueryContext = (): ContextInterface<DeliveryJobData> =>
  useQueryContext<DeliveryJobData>(appvars.ENTITY.DELIVERY_JOB)

export { DeliveryJobQueryProvider, useDeliveryJobQueryContext }
