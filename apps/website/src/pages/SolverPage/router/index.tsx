/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { ReactElement } from 'react'
import { Route, Switch } from 'react-router-dom'
import { SolverJobQueryProvider } from '../../../contexts/SolverJobQueryContext'
import { DeliveryJobQueryProvider } from '../../../contexts/DeliveryJobQueryContext'
import { SolverJobList } from '../SolverJobList'
import { appvars } from '../../../config'
import { DeliveryJobList } from '../DeliveryJobList'

export const SolverPageRouter = (): ReactElement => {
  return (
    <SolverJobQueryProvider>
      <DeliveryJobQueryProvider>
        <Switch>
          <Route exact path={[`/${appvars.URL.SOLVER_JOB}/:solverJobId`]}>
            <DeliveryJobList />
          </Route>
          <Route>
            <SolverJobList />
          </Route>
        </Switch>
      </DeliveryJobQueryProvider>
    </SolverJobQueryProvider>
  )
}
