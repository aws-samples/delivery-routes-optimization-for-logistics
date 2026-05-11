/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import type { VehicleData } from '../../models'
import type { CrudService } from '../../services/base/crudService'
import { createDataProvider, useDataContext } from '../base/DataContext'
import type { ContextInterface } from '../base/DataContext'
import { appvars } from '../../config'
import VehicleService from '../../services/vehicle'

const VehicleProvider = createDataProvider<VehicleData, CrudService<VehicleData>>(
  appvars.ENTITY.VEHICLE,
  VehicleService,
)
const useVehicleContext = (): ContextInterface<VehicleData> => useDataContext<VehicleData>(appvars.ENTITY.VEHICLE)

export { VehicleProvider, useVehicleContext }
