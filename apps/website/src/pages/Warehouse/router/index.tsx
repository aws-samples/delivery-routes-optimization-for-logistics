/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { ReactElement } from 'react'
import { Route, Switch } from 'react-router-dom'
import { WarehouseProvider } from '../../../contexts/WarehouseContext'
import { List } from '../List'
import { Editor } from '../Editor'
import { Details } from '../Details'
import { appvars } from '../../../config'

export const WarehouseRouter = (): ReactElement => {
  return (
    <WarehouseProvider>
      <Switch>
        <Route exact path={[`/${appvars.URL.WAREHOUSE}/:warehouseId/edit`, `/${appvars.URL.WAREHOUSE}/new`]}>
          <Editor />
        </Route>
        <Route exact path={[`/${appvars.URL.WAREHOUSE}/:warehouseId`]}>
          <Details />
        </Route>
        <Route>
          <List />
        </Route>
      </Switch>
    </WarehouseProvider>
  )
}
