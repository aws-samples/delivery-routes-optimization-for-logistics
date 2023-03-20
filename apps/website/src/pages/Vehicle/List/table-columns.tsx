/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { Link } from 'aws-northstar'
import { Column, Cell } from 'react-table'
import { appvars } from '../../../config'
import { VehicleData } from '../../../models'

export const columnDefinitions: Column<VehicleData>[] = [
  {
    id: 'carNo',
    width: 200,
    Header: 'Car No.',
    accessor: 'carNo',
    Cell: ({ row }: Cell<VehicleData>): any => {
      if (row && row.original) {
        const { Id } = row.original
        const { carNo } = row.original

        return (
          <Link underlineHover={false} href={`/${appvars.URL.VEHICLE}/${Id}`}>
            {carNo}
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
    id: 'carGrade',
    width: 100,
    Header: 'Grade',
    accessor: 'carGrade',
  },
  {
    id: 'maxWeight',
    width: 150,
    Header: 'Max Capacity',
    accessor: 'maxWeight',
  },
]
