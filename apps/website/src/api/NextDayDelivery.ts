/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import common from './Common'

const buildDistanceCache = (warehouseCode: string): Promise<any> => {
  return common.commonGetRequest(`/build-dist-cache/${warehouseCode}`)
}

const getSolverJobById = (solverJobId: string, nextToken?: string): Promise<any> => {
  return common.commonGetRequest(`/solver-job/${solverJobId}`)
}

const getDeliveryJobsBySolverJob = (solverJobId: string, nextToken?: string): Promise<any> => {
  return common.commonGetRequest(
    `/delivery-solver-job/${solverJobId}`,
    nextToken
      ? {
          nextToken,
        }
      : {},
  )
}

const getDeliveryJobsAll = (nextToken?: string): Promise<any> => {
  return common.commonGetRequest(
    '/delivery-job',
    nextToken
      ? {
          nextToken,
        }
      : {},
  )
}

export default {
  buildDistanceCache,
  getSolverJobById,
  getDeliveryJobsAll,
  getDeliveryJobsBySolverJob,
}
