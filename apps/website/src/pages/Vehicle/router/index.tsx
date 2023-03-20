/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { ReactElement } from 'react'
import { Route, Switch } from 'react-router-dom'
import { VehicleProvider } from '../../../contexts/VehicleContext'
import { List } from '../List'
import { Editor } from '../Editor'
import { Details } from '../Details'
import { appvars } from '../../../config'

export const VehicleRouter = (): ReactElement => {
  return (
    <VehicleProvider>
      <Switch>
        <Route exact path={[`/${appvars.URL.VEHICLE}/:vehicleId/edit`, `/${appvars.URL.VEHICLE}/new`]}>
          <Editor />
        </Route>
        <Route exact path={[`/${appvars.URL.VEHICLE}/:vehicleId`]}>
          <Details />
        </Route>
        <Route>
          <List />
        </Route>
      </Switch>
    </VehicleProvider>
  )
}
