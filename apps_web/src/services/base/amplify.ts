/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { Amplify } from 'aws-amplify'
import { fetchAuthSession } from 'aws-amplify/auth'
import { appvars } from '../../config'

/**
 * Initialize Amplify v6 with runtime configuration from `window.appVariables`.
 *
 * Key v4 -> v6 differences:
 *   - Auth: `{ region, userPoolId, userPoolWebClientId }`
 *       becomes `{ Cognito: { userPoolId, userPoolClientId } }` (region is inferred from the pool ID)
 *   - API: the config-level `custom_header` callback was removed.
 *       Authorization must be injected per-request via `options.headers`.
 *       See `api/Common.ts#getAuthHeaders`.
 */
export const initializeAmplify = (): void => {
  const {
    BACKENDVARS: { USERPOOL_ID, USERPOOL_CLIENT_ID, API_URL, API_PREFIX, API_DS_NAME, REGION },
  } = appvars

  const endpoint = API_URL.endsWith('/') ? `${API_URL}${API_PREFIX}` : `${API_URL}/${API_PREFIX}`

  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: USERPOOL_ID,
        userPoolClientId: USERPOOL_CLIENT_ID,
      },
    },
    API: {
      REST: {
        [API_DS_NAME]: {
          endpoint,
          region: REGION,
        },
      },
    },
  })
}

/**
 * Fetch the Cognito ID token for the current session, returning an empty map
 * if the user is not signed in (callers can still proceed unauthenticated).
 */
export const getAuthHeaders = async (): Promise<Record<string, string>> => {
  try {
    const { tokens } = await fetchAuthSession()
    const idToken = tokens?.idToken?.toString()
    return idToken ? { Authorization: idToken } : {}
  } catch {
    return {}
  }
}
