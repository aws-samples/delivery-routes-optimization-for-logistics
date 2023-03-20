/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { VehicleData } from '../models'
import { CrudService } from './base/crudService'
import { appvars } from '../config'

const VehicleService = new CrudService<VehicleData>('vehicle', appvars.ENDPOINT.VEHICLE, {})

export default VehicleService
