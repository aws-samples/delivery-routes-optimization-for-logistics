/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import type { TableProps } from '@cloudscape-design/components'
import { Link } from '@cloudscape-design/components'
import type { NavigateFunction } from 'react-router-dom'
import type { DistanceCacheData } from '../../../models'
import { appvars } from '../../../config'

export const columnDefinitions = (
  navigate: NavigateFunction,
): TableProps.ColumnDefinition<DistanceCacheData>[] => [
  {
    id: 'id',
    header: 'No.',
    width: 200,
    cell: (item) => (
      <Link
        href={`/${appvars.URL.DISTANCE_CACHE}/${item.Id}`}
        onFollow={(e) => {
          e.preventDefault()
          navigate(`/${appvars.URL.DISTANCE_CACHE}/${item.Id}`)
        }}
      >
        {item.Id}
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
    id: 'numOfLocations',
    header: 'Locations',
    sortingField: 'numOfLocations',
    width: 150,
    cell: (item) => item.numOfLocations,
  },
  {
    id: 'status',
    header: 'Status',
    sortingField: 'status',
    width: 150,
    cell: (item) => item.status,
  },
  {
    id: 'buildTime',
    header: 'Created',
    sortingField: 'buildTime',
    width: 180,
    cell: (item) => item.buildTime,
  },
]
