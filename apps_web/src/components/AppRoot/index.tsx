/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { withAuthenticator } from '@aws-amplify/ui-react'
import '@aws-amplify/ui-react/styles.css'

import { AuthenticatedUserContextProvider } from '../../contexts/AuthenticatedUserContext'
import { appvars } from '../../config'
import AppLayout from '../AppLayout'
import HomePage from '../../pages/HomePage'
import NotFound from '../NotFound'
import { CustomerLocationRouter } from '../../pages/CustomerLocation/router'
import { WarehouseRouter } from '../../pages/Warehouse/router'
import { VehicleRouter } from '../../pages/Vehicle/router'
import { OrderRouter } from '../../pages/Order/router'
import { DistanceCacheRouter } from '../../pages/DistanceCache/router'
import { SolverPageRouter } from '../../pages/SolverPage/router'

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const AppRoot = () => {
  return (
    <AuthenticatedUserContextProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path={`/${appvars.URL.CUSTOMER_LOCATION}/*`} element={<CustomerLocationRouter />} />
            <Route path={`/${appvars.URL.WAREHOUSE}/*`} element={<WarehouseRouter />} />
            <Route path={`/${appvars.URL.VEHICLE}/*`} element={<VehicleRouter />} />
            <Route path={`/${appvars.URL.ORDER}/*`} element={<OrderRouter />} />
            <Route path={`/${appvars.URL.DISTANCE_CACHE}/*`} element={<DistanceCacheRouter />} />
            <Route path={`/${appvars.URL.SOLVER_JOB}/*`} element={<SolverPageRouter />} />
            <Route path='*' element={<NotFound what='Page' backUrl='' />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthenticatedUserContextProvider>
  )
}

export default withAuthenticator(AppRoot)
