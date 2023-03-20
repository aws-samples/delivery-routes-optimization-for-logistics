/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { createContext, useState, useEffect, useCallback, useContext } from 'react'
import { CognitoUser, CognitoUserSession } from 'amazon-cognito-identity-js'
import { Auth } from 'aws-amplify'
import { Container, Text } from 'aws-northstar'

// :: ---
interface IAuthContext {
  readonly user: CognitoUser
  readonly userInfo: any
  readonly session: CognitoUserSession
  readonly userGroups: string[]
}

interface Claims {
  aud: string
  auth_time: number
  'cognito:groups': string[]
  'cognito:username': string
  email: string
  exp: number
  iat: number
  iss: string
  sub: string
  token_use: string
  email_verified: boolean
  phone_number_verified: boolean
  // cognito attributes
  family_name: string
  given_name: string
}

const AuthenticatedUserContext = createContext<IAuthContext | undefined>(undefined)

export const AuthenticatedUserContextProvider: React.FC = ({ children }) => {
  const [state, setState] = useState<IAuthContext>()
  const [errorState, setErrorState] = useState<Error>()

  const processAuth = useCallback(async () => {
    try {
      const user: CognitoUser = await Auth.currentAuthenticatedUser()
      const userInfo = await Auth.currentUserInfo()
      const session = await Auth.currentSession()
      const claims = session.getIdToken().decodePayload() as unknown as Claims
      const userGroups = claims['cognito:groups']

      setState({
        user,
        userInfo,
        session,
        userGroups,
      })
    } catch (err) {
      console.error(err)
      setErrorState(err as Error)
    }
  }, [])

  // Setup auth initially when component is mounted and listen for token refreshes
  useEffect(() => {
    processAuth()

    // triggered whenever session is updated with new creds
    Auth.wrapRefreshSessionCallback(() => {
      processAuth()
    })
  }, [processAuth])

  if (errorState != null) {
    return (
      <Container title='Authorization Failed'>
        <Text>{errorState.message}</Text>
      </Container>
    )
  }

  if (state == null) {
    return null
  }

  return <AuthenticatedUserContext.Provider value={state}>{children}</AuthenticatedUserContext.Provider>
}

export default AuthenticatedUserContext

export const useAuthContext = (): IAuthContext => {
  const context = useContext(AuthenticatedUserContext)

  if (context == null) {
    throw new Error('Must wrap with AuthenticatedUserContextProvider for useAuthContext')
  }

  return context
}
