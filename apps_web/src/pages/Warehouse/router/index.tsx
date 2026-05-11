/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import type { ReactElement } from 'react'
import { Route, Routes } from 'react-router-dom'
import { WarehouseProvider } from '../../../contexts/WarehouseContext'
import { List } from '../List'
import { Editor } from '../Editor'
import { Details } from '../Details'

export const WarehouseRouter = (): ReactElement => {
  return (
    <WarehouseProvider>
      <Routes>
        <Route path='new' element={<Editor />} />
        <Route path=':warehouseId/edit' element={<Editor />} />
        <Route path=':warehouseId' element={<Details />} />
        <Route index element={<List />} />
      </Routes>
    </WarehouseProvider>
  )
}
