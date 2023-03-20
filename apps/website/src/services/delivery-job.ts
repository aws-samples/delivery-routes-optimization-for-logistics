/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { DeliveryJobData } from '../models'
import { appvars } from '../config'
import { QueryService } from './base/queryService'

const DeliveryJobService = new QueryService<DeliveryJobData>('solver-job', appvars.ENDPOINT.DELIVERY_JOB, {})

export default DeliveryJobService
