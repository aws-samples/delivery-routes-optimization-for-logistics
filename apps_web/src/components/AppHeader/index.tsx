/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import type { FunctionComponent } from 'react'
import { TopNavigation, type TopNavigationProps } from '@cloudscape-design/components'
import { signOut } from 'aws-amplify/auth'
import { useAuthContext } from '../../contexts/AuthenticatedUserContext'

const APP_TITLE = 'Delivery Route Optimization with Order Dispatching'

const AppHeader: FunctionComponent = () => {
  const { userInfo } = useAuthContext()
  const displayName = (userInfo?.nickname ?? userInfo?.email ?? userInfo?.given_name ?? 'User') as string

  const utilities: TopNavigationProps.Utility[] = [
    {
      type: 'menu-dropdown',
      text: displayName,
      iconName: 'user-profile',
      items: [
        { id: 'signout', text: 'Sign out' },
      ],
      onItemClick: (event) => {
        if (event.detail.id === 'signout') {
          void signOut()
        }
      },
    },
  ]

  return (
    <div id='app-header' style={{ position: 'sticky', top: 0, zIndex: 1002 }}>
      <TopNavigation
        identity={{
          href: '/',
          title: APP_TITLE,
        }}
        utilities={utilities}
      />
    </div>
  )
}

export default AppHeader
