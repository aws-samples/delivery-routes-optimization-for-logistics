/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { OrderData } from '../models'
import { appvars } from '../config'
import { CrudService } from './base/crudService'

const OrderService = new CrudService<OrderData>('order', appvars.ENDPOINT.ORDER, {})

export default OrderService
