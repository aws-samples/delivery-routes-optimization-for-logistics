/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { ReactElement } from 'react'
import { Route, Switch } from 'react-router-dom'
import { OrderQueryProvider } from '../../../contexts/OrderQueryContext'
import { List } from '../List'
import { Editor } from '../Editor'
import { Details } from '../Details'
import { appvars } from '../../../config'

export const OrderRouter = (): ReactElement => {
  return (
    <OrderQueryProvider>
      <Switch>
        <Route exact path={[`/${appvars.URL.ORDER}/:orderId/edit`, `/${appvars.URL.ORDER}/new`]}>
          <Editor />
        </Route>
        <Route exact path={[`/${appvars.URL.ORDER}/:orderId`]}>
          <Details />
        </Route>
        <Route>
          <List />
        </Route>
      </Switch>
    </OrderQueryProvider>
  )
}
