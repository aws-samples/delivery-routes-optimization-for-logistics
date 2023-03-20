/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { FunctionComponent } from 'react'
import { useAuthContext } from '../../../../contexts/AuthenticatedUserContext'
import { Box, Text } from 'aws-northstar'
import { AmplifySignOut } from '@aws-amplify/ui-react'

// :: ---

const AuthInfo: FunctionComponent = () => {
  const { userInfo } = useAuthContext()

  return (
    <Box display='flex' alignItems='center'>
      {userInfo && userInfo.attributes && (
        <>
          <div className='px-8'>
            <Text>{userInfo.attributes.nickname}</Text>
          </div>
          <AmplifySignOut />
        </>
      )}
    </Box>
  )
}

export default AuthInfo
