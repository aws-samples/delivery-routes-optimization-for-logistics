/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

/**
 * Returns the value of `appVariables[key]`,
 * but throws an error if the key is not set.
 *
 * `appVariables` is populated at runtime by `/static/appvars.js`
 * which is loaded before the React bundle.
 */
const requireVariable = (key: string): any => {
  if (typeof appVariables === 'undefined' || appVariables === null) {
    throw new Error(
      'Global `appVariables` is not defined. ' +
        'Ensure `public/static/appvars.js` exists and is loaded from `index.html` before the main bundle.',
    )
  }

  if (!Object.prototype.hasOwnProperty.call(appVariables, key)) {
    throw new Error(`Key ${key} not set in app variables.`)
  }

  return appVariables[key]
}

// :: ---
export const BACKENDVARS = {
  REGION: requireVariable('REGION') as string,
  USERPOOL_ID: requireVariable('USERPOOL_ID') as string,
  USERPOOL_CLIENT_ID: requireVariable('USERPOOL_CLIENT_ID') as string,
  API_URL: requireVariable('API_URL') as string,
  API_PREFIX: 'api/web',
  API_DS_NAME: 'datasource',
}

export const MAP_VARS = {
  // OpenFreeMap style URL (no API key required)
  MAP_STYLE: 'https://tiles.openfreemap.org/styles/liberty',

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
