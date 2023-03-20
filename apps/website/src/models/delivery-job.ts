/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { appvars } from '../config'
import { dayjsutc } from '../utils/dayjs'

export interface DeliveryJobData {
  Id: string
  carNo: number
  deliveryTimeGroup: number
  loadCapacity: number
  maxCapacity: number
  solverJobId: string
  latitude: number
  longitude: number
  createdAt: number
  segments: any
}

export const EMPTY_DELIVERYJOB_DATA: DeliveryJobData = {
  Id: '',
  carNo: 0,
  deliveryTimeGroup: 0,
  loadCapacity: 0,
  maxCapacity: 0,
  solverJobId: '',
  latitude: 0,
  longitude: 0,
  createdAt: Date.now(),
  segments: [],
}

export interface selectDeliveryJobData {
  Id: string
  deliveryCode: number
  deliveryName: string
  deliveryTimeGroup: number
  demands: number
  from: number
  to: number
  lat: number
  long: number
}

export const EMPTY_SELECT_DELIVERYJOB_DATA: selectDeliveryJobData = {
  Id: '',
  deliveryCode: 0,
  deliveryName: '',
  deliveryTimeGroup: 0,
  demands: 0,
  from: 0,
  to: 0,
  lat: 0,
  long: 0,
}
