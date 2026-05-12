/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import type { OrderData } from '../../models'
import type { CrudService } from '../../services/base/crudService'
import { createDataProvider, useDataContext } from '../base/DataContext'
import type { ContextInterface } from '../base/DataContext'
import { appvars } from '../../config'
import OrderService from '../../services/order'

const OrderQueryProvider = createDataProvider<OrderData, CrudService<OrderData>>(appvars.ENTITY.ORDER, OrderService)
const useOrderContext = (): ContextInterface<OrderData> => useDataContext<OrderData>(appvars.ENTITY.ORDER)

export { OrderQueryProvider, useOrderContext }
