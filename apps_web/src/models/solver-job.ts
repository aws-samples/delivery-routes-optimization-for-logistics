/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

export interface SolverJobData {
  Id: string
  executionId: string
  orderCount: number
  orderDate: string
  score: number
  solverDurationInMs: number
  state: string
  createdAt: number
  warehouseCode: string
  warehouseName: string
}

export const EMPTY_SOLVERJOB_DATA: SolverJobData = {
  Id: '',
  executionId: '',
  orderCount: 0,
  orderDate: '',
  score: 0,
  solverDurationInMs: 0,
  state: '',
  createdAt: Date.now(),
  warehouseCode: '',
  warehouseName: '',
}
