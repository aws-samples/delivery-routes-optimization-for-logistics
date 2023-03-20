/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { ComponentType, FunctionComponent } from 'react'
import { NorthStarThemeProvider } from 'aws-northstar'
import { Route, BrowserRouter as Router, Switch } from 'react-router-dom'
import { withAuthenticator } from '@aws-amplify/ui-react'
import { AuthenticatedUserContextProvider } from '../../contexts/AuthenticatedUserContext'
import { appvars } from '../../config'
import AppLayout from '../AppLayout'
import HomePage from '../../pages/HomePage'
import './AppRoot.css'
import { CustomerLocationRouter } from '../../pages/CustomerLocation/router'
import { WarehouseRouter } from '../../pages/Warehouse/router'
import { VehicleRouter } from '../../pages/Vehicle/router'
import { OrderRouter } from '../../pages/Order/router'
import { DistanceCacheRouter } from '../../pages/DistanceCache/router'
import { SolverPageRouter } from '../../pages/SolverPage/router'

const withLayout =
  (Component: ComponentType): FunctionComponent =>
  (props) =>
    (
      <AppLayout>
        <Component {...props} />
      </AppLayout>
    )

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const AppRoot = () => {
  return (
    <NorthStarThemeProvider>
      <AuthenticatedUserContextProvider>
        <Router>
          <Switch>
            <Route path={`/${appvars.URL.CUSTOMER_LOCATION}`} component={withLayout(CustomerLocationRouter)} />
            <Route path={`/${appvars.URL.WAREHOUSE}`} component={withLayout(WarehouseRouter)} />
            <Route path={`/${appvars.URL.VEHICLE}`} component={withLayout(VehicleRouter)} />
            <Route path={`/${appvars.URL.ORDER}`} component={withLayout(OrderRouter)} />
            <Route path={`/${appvars.URL.DISTANCE_CACHE}`} component={withLayout(DistanceCacheRouter)} />
            <Route path={`/${appvars.URL.SOLVER_JOB}`} component={withLayout(SolverPageRouter)} />
            <Route exact path='/' component={withLayout(HomePage)} />
          </Switch>
        </Router>
      </AuthenticatedUserContextProvider>
    </NorthStarThemeProvider>
  )
}

export default withAuthenticator(AppRoot)
