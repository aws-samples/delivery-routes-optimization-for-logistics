/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import Amplify, { Auth as AmplifyAuth, API as AmplifyAPI } from 'aws-amplify'
import { appvars } from '../../config'

const {
  BACKENDVARS: { REGION, USERPOOL_ID, USERPOOL_CLIENT_ID, API_URL, API_PREFIX, API_DS_NAME },
} = appvars

// :: ---

const Auth = {
  region: REGION,
  userPoolId: USERPOOL_ID,
  userPoolWebClientId: USERPOOL_CLIENT_ID,
}

const endpoint = (API_URL as string).endsWith('/') ? `${API_URL}${API_PREFIX}` : `${API_URL}/${API_PREFIX}`

const API = {
  endpoints: [
    {
      name: API_DS_NAME,
      endpoint,

      // eslint-disable-next-line @typescript-eslint/naming-convention
      custom_header: async (): Promise<{ Authorization: string }> => ({
        Authorization: `${(await AmplifyAuth.currentSession()).getIdToken().getJwtToken()}`,
      }),
    },
  ],
}

export const initializeAmplify = (): void => {
  Amplify.configure({ Auth, API })
}
