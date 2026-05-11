/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import type { ReactElement } from 'react'
import { Route, Routes } from 'react-router-dom'
import { VehicleProvider } from '../../../contexts/VehicleContext'
import { List } from '../List'
import { Editor } from '../Editor'
import { Details } from '../Details'

export const VehicleRouter = (): ReactElement => {
  return (
    <VehicleProvider>
      <Routes>
        <Route path='new' element={<Editor />} />
        <Route path=':vehicleId/edit' element={<Editor />} />
        <Route path=':vehicleId' element={<Details />} />
        <Route index element={<List />} />
      </Routes>
    </VehicleProvider>
  )
}
