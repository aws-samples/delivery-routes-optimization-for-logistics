/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import type { TableProps } from '@cloudscape-design/components'
import { Link } from '@cloudscape-design/components'
import type { NavigateFunction } from 'react-router-dom'
import type { VehicleData } from '../../../models'
import { appvars } from '../../../config'

export const columnDefinitions = (
  navigate: NavigateFunction,
): TableProps.ColumnDefinition<VehicleData>[] => [
  {
    id: 'carNo',
    header: 'Car No.',
    sortingField: 'carNo',
    width: 200,
    cell: (item) => (
      <Link
        href={`/${appvars.URL.VEHICLE}/${item.Id}`}
        onFollow={(e) => {
          e.preventDefault()
          navigate(`/${appvars.URL.VEHICLE}/${item.Id}`)
        }}
      >
        {item.carNo}
      </Link>
    ),
  },
  {
    id: 'warehouseCode',
    header: 'Department (Warehouse)',
    sortingField: 'warehouseCode',
    width: 200,
    cell: (item) => item.warehouseCode,
  },
  {
    id: 'carGrade',
    header: 'Grade',
    sortingField: 'carGrade',
    width: 120,
    cell: (item) => item.carGrade,
  },
  {
    id: 'maxWeight',
    header: 'Max Capacity',
    sortingField: 'maxWeight',
    width: 150,
    cell: (item) => item.maxWeight,
  },
]
