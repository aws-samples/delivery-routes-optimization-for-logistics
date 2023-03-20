/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { WarehouseData } from '../models'
import { CrudService } from './base/crudService'
import { appvars } from '../config'

const WarehouseService = new CrudService<WarehouseData>('warehouse', appvars.ENDPOINT.WAREHOUSE, {})

export default WarehouseService
