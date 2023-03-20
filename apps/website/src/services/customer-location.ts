/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { CustomerLocationData } from '../models'
import { CrudService } from './base/crudService'
import { appvars } from '../config'

const CustomerLocationService = new CrudService<CustomerLocationData>(
  'customer-location',
  appvars.ENDPOINT.CUSTOMER_LOCATION,
  {},
)

export default CustomerLocationService
