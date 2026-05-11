/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import type { ReactElement } from 'react'
import { Route, Routes } from 'react-router-dom'
import { CustomerLocationProvider } from '../../../contexts/CustomerLocationContext'
import { List } from '../List'
import { Editor } from '../Editor'
import { Details } from '../Details'

export const CustomerLocationRouter = (): ReactElement => {
  return (
    <CustomerLocationProvider>
      <Routes>
        <Route path='new' element={<Editor />} />
        <Route path=':customerLocationId/edit' element={<Editor />} />
        <Route path=':customerLocationId' element={<Details />} />
        <Route index element={<List />} />
      </Routes>
    </CustomerLocationProvider>
  )
}
