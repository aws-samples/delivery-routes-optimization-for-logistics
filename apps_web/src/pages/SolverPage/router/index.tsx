/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import type { ReactElement } from 'react'
import { Route, Routes } from 'react-router-dom'
import { SolverJobQueryProvider } from '../../../contexts/SolverJobQueryContext'
import { DeliveryJobQueryProvider } from '../../../contexts/DeliveryJobQueryContext'
import { SolverJobList } from '../SolverJobList'
import { DeliveryJobList } from '../DeliveryJobList'

export const SolverPageRouter = (): ReactElement => {
  return (
    <SolverJobQueryProvider>
      <DeliveryJobQueryProvider>
        <Routes>
          <Route path=':solverJobId' element={<DeliveryJobList />} />
          <Route index element={<SolverJobList />} />
        </Routes>
      </DeliveryJobQueryProvider>
    </SolverJobQueryProvider>
  )
}
