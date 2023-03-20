/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

export interface CustomerLocationData {
  Id: string
  deliveryCode: string
  deliveryName: string
  warehouseCode: string
  address: string
  latitude: number
  longitude: number
  createdAt: number
  updatedAt: number
}

export const EMPTY_CUSTOMER_LOCATION: CustomerLocationData = {
  Id: '',
  deliveryCode: '',
  deliveryName: '',
  warehouseCode: '',
  address: '',
  latitude: 0,
  longitude: 0,
  createdAt: Date.now(),
  updatedAt: Date.now(),
}
