/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
  type ReactElement,
} from 'react'
import {
  fetchAuthSession,
  fetchUserAttributes,
  getCurrentUser,
  type AuthSession,
  type AuthUser,
  type FetchUserAttributesOutput,
} from 'aws-amplify/auth'
import { Hub } from 'aws-amplify/utils'
import { Alert, Container, Header } from '@cloudscape-design/components'

interface Claims {
  aud: string
  auth_time: number
  'cognito:groups'?: string[]
  'cognito:username'?: string
  email?: string
  exp: number
  iat: number
  iss: string
  sub: string
  token_use: string
  email_verified?: boolean
  phone_number_verified?: boolean
  family_name?: string
  given_name?: string
}

interface IAuthContext {
  readonly user: AuthUser
  readonly userInfo: FetchUserAttributesOutput
  readonly session: AuthSession
  readonly userGroups: string[]
}

const AuthenticatedUserContext = createContext<IAuthContext | undefined>(undefined)

export const AuthenticatedUserContextProvider = ({ children }: PropsWithChildren): ReactElement | null => {
  const [state, setState] = useState<IAuthContext>()
  const [errorState, setErrorState] = useState<Error>()

  const processAuth = useCallback(async () => {
    try {
      const user = await getCurrentUser()
      const userInfo = await fetchUserAttributes()
      const session = await fetchAuthSession()

      const idTokenPayload = session.tokens?.idToken?.payload as Claims | undefined
      const userGroups = (idTokenPayload?.['cognito:groups'] ?? []) as string[]

      setState({ user, userInfo, session, userGroups })
    } catch (err) {
      console.error(err)
      setErrorState(err as Error)
    }
  }, [])

  useEffect(() => {
    processAuth()

    // In v6, token refresh events are surfaced on the 'auth' Hub channel.
    const unsubscribe = Hub.listen('auth', ({ payload }) => {
      if (payload.event === 'tokenRefresh' || payload.event === 'signedIn') {
        processAuth()
      }
    })

    return () => {
      unsubscribe()
    }
  }, [processAuth])

  if (errorState != null) {
    return (
      <Container header={<Header variant='h2'>Authorization Failed</Header>}>
        <Alert type='error'>{errorState.message}</Alert>
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
