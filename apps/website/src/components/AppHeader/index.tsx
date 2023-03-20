/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { FunctionComponent, useMemo } from 'react'
import HeaderBase from 'aws-northstar/components/Header'
import AuthInfo from './components/AuthInfo'

const AppHeader: FunctionComponent = () => {
  const appHeader = useMemo(() => {
    return <HeaderBase title='Delivery Route Optimization with Order Dispatching' rightContent={<AuthInfo />} />
  }, [])

  return appHeader
}

export default AppHeader
