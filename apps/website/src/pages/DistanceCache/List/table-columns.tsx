/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { Link } from 'aws-northstar'
import { Column, Cell } from 'react-table'
import { appvars } from '../../../config'
import { DistanceCacheData } from '../../../models'

export const columnDefinitions: Column<DistanceCacheData>[] = [
  {
    id: 'carNo',
    width: 200,
    Header: 'No.',
    accessor: 'Id',
    Cell: ({ row }: Cell<DistanceCacheData>): any => {
      if (row && row.original) {
        const { Id } = row.original

        return (
          <Link underlineHover={false} href={`/${appvars.URL.DISTANCE_CACHE}/${Id}`}>
            {'CACHE' + (row.index + 1)}
          </Link>
        )
      }

      return row.id
    },
  },
  {
    id: 'warehouseCode',
    width: 200,
    Header: 'Department(Warehouse)',
    accessor: 'warehouseCode',
  },
  {
    id: 'numOfLocations',
    width: 150,
    Header: 'Locations',
    accessor: 'numOfLocations',
  },
  {
    id: 'status',
    width: 150,
    Header: 'status',
    accessor: 'status',
  },
  {
    id: 'buildTime',
    width: 150,
    Header: 'Created',
    accessor: 'buildTime',
  },
]
