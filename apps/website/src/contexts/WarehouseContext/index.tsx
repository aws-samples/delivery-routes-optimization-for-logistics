/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { WarehouseData } from '../../models'
import { CrudService } from '../../services/base/crudService'
import { ContextInterface, createDataProvider, useDataContext } from '../base/DataContext'
import { appvars } from '../../config'
import WarehouseService from '../../services/warehouse'

const WarehouseProvider = createDataProvider<WarehouseData, CrudService<WarehouseData>>(
  appvars.ENTITY.WAREHOUSE,
  WarehouseService,
)
const useWarehouseContext = (): ContextInterface<WarehouseData> =>
  useDataContext<WarehouseData>(appvars.ENTITY.WAREHOUSE)

export { WarehouseProvider, useWarehouseContext }
