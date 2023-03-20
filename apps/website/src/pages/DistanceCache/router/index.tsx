/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { ReactElement } from 'react'
import { Route, Switch } from 'react-router-dom'
import { DistanceCacheProvider } from '../../../contexts/DistanceCacheContext'
import { List } from '../List'
import { Details } from '../Details'
import { appvars } from '../../../config'

export const DistanceCacheRouter = (): ReactElement => {
  return (
    <DistanceCacheProvider>
      <Switch>
        <Route exact path={[`/${appvars.URL.DISTANCE_CACHE}/:distCacheId`]}>
          <Details />
        </Route>
        <Route>
          <List />
        </Route>
      </Switch>
    </DistanceCacheProvider>
  )
}
