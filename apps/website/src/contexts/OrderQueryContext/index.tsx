/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { OrderData } from '../../models'
import { CrudService } from '../../services/base/crudService'
import { ContextInterface, createDataProvider, useDataContext } from '../base/DataContext'
import { appvars } from '../../config'
import OrderQueryService from '../../services/order'

const OrderQueryProvider = createDataProvider<OrderData, CrudService<OrderData>>(
  appvars.ENTITY.ORDER,
  OrderQueryService,
)
const useOrderContext = (): ContextInterface<OrderData> => useDataContext<OrderData>(appvars.ENTITY.ORDER)

export { OrderQueryProvider, useOrderContext }
