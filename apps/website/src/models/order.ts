/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

export interface OrderData {
  Id: string
  createdAt: number
  orderNo: string
  orderDate: string
  deliveryCode: string
  deliveryName: string
  warehouseCode: string
  sumWeight: number
}

export const EMPTY_ORDER_DATA: OrderData = {
  Id: '',
  createdAt: Date.now(),
  orderNo: '',
  orderDate: '',
  deliveryCode: '',
  deliveryName: '',
  warehouseCode: '',
  sumWeight: 0,
}
