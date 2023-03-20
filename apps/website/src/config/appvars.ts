/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

/**
 * Returns the value of `parent[key]`,
 * but throws an error if the key is not set.
 *
 * @param {string} key
 */
const requireVariable = (key: string): any => {
  if (!Object.prototype.hasOwnProperty.call(appVariables, key)) {
    throw new Error(`Key ${key} not set in app variables.`)
  }

  return appVariables[key]
}

// :: ---
export const BACKENDVARS = {
  REGION: requireVariable('REGION'),
  USERPOOL_ID: requireVariable('USERPOOL_ID'),
  USERPOOL_CLIENT_ID: requireVariable('USERPOOL_CLIENT_ID'),
  API_URL: requireVariable('API_URL'),
  API_PREFIX: 'api/web',
  API_DS_NAME: 'datasource',
}

export const MAPBOX_VARS = {
  // MapBox API Token.
  MAPBOX_TOKEN: requireVariable('MAPBOX_TOKEN'),

  // Map Default location : Seoul station
  DEFAULT_LATITUDE: 37.5577857,
  DEFAULT_LONGITUDE: 126.9697484,
}

export const ENDPOINT = {
  CUSTOMER_LOCATION: 'customer-location',
  WAREHOUSE: 'warehouse',
  DELIVERY_JOB: 'delivery-job',
  ORDER: 'order',
  SOLVER_JOB: 'solver-job',
  VEHICLE: 'vehicle',
  DISTANCE_CACHE: 'dist-cache',
}

export const URL = {
  CUSTOMER_LOCATION: 'customer-location',
  WAREHOUSE: 'warehouse',
  DELIVERY_JOB: 'delivery-job',
  ORDER: 'order',
  SOLVER_JOB: 'solver-job',
  VEHICLE: 'vehicle',
  DISTANCE_CACHE: 'dist-cache',
}

export const DATEFORMAT = 'YYYY-MM-DD'
export const DATETIMEFORMAT = 'YYYY-MM-DD HH:mm:ss'

export const ENTITY = {
  CUSTOMER_LOCATION: 'customer-location',
  WAREHOUSE: 'warehouse',
  DELIVERY_JOB: 'delivery-job',
  ORDER: 'order',
  SOLVER_JOB: 'solver-job',
  VEHICLE: 'vehicle',
  DISTANCE_CACHE: 'dist-cache',
}
