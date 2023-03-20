/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { ReactElement } from 'react'
import { Route, Switch } from 'react-router-dom'
import { CustomerLocationProvider } from '../../../contexts/CustomerLocationContext'
import { List } from '../List'
import { Editor } from '../Editor'
import { Details } from '../Details'
import { appvars } from '../../../config'

export const CustomerLocationRouter = (): ReactElement => {
  return (
    <CustomerLocationProvider>
      <Switch>
        <Route
          exact
          path={[`/${appvars.URL.CUSTOMER_LOCATION}/:customerLocationId/edit`, `/${appvars.URL.CUSTOMER_LOCATION}/new`]}
        >
          <Editor />
        </Route>
        <Route exact path={[`/${appvars.URL.CUSTOMER_LOCATION}/:customerLocationId`]}>
          <Details />
        </Route>
        <Route>
          <List />
        </Route>
      </Switch>
    </CustomerLocationProvider>
  )
}
