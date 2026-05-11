/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import type { CustomerLocationData } from '../../models'
import type { CrudService } from '../../services/base/crudService'
import { createDataProvider, useDataContext } from '../base/DataContext'
import type { ContextInterface } from '../base/DataContext'
import { appvars } from '../../config'
import CustomerLocationService from '../../services/customer-location'

const CustomerLocationProvider = createDataProvider<CustomerLocationData, CrudService<CustomerLocationData>>(
  appvars.ENTITY.CUSTOMER_LOCATION,
  CustomerLocationService,
)
const useCustomerLocationContext = (): ContextInterface<CustomerLocationData> =>
  useDataContext<CustomerLocationData>(appvars.ENTITY.CUSTOMER_LOCATION)

export { CustomerLocationProvider, useCustomerLocationContext }
