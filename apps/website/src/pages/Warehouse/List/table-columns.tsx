/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { Link, Checkbox } from 'aws-northstar'
import { Column, Cell } from 'react-table'
import { dayjslocal } from '../../../utils/dayjs'
import { appvars } from '../../../config'
import { WarehouseData } from '../../../models'

export const columnDefinitions: Column<WarehouseData>[] = [
  {
    id: 'warehouseName',
    width: 250,
    Header: 'Name',
    accessor: 'warehouseName',
    Cell: ({ row }: Cell<WarehouseData>): any => {
      if (row && row.original) {
        const { Id } = row.original
        const { warehouseName } = row.original

        return (
          <Link underlineHover={false} href={`/${appvars.URL.WAREHOUSE}/${Id}`}>
            {warehouseName}
          </Link>
        )
      }

      return row.id
    },
  },
  {
    id: 'warehouseCode',
    width: 160,
    Header: 'Warehouse Code',
    accessor: 'warehouseCode',
  },
  {
    id: 'address',
    width: 500,
    Header: 'Address',
    accessor: 'address',
  },
  {
    id: 'createdAt',
    width: 160,
    Header: 'Created',
    accessor: 'createdAt',
    Cell: ({ row }: Cell<WarehouseData>): any => {
      if (row && row.original) {
        const { createdAt } = row.original

        return dayjslocal(createdAt).format(appvars.DATETIMEFORMAT)
      }

      return row.id
    },
  },
  {
    id: 'updatedAt',
    width: 160,
    Header: 'Updated',
    accessor: 'updatedAt',
    Cell: ({ row }: Cell<WarehouseData>): any => {
      if (row && row.original) {
        const { updatedAt } = row.original

        return dayjslocal(updatedAt).format(appvars.DATETIMEFORMAT)
      }

      return row.id
    },
  },
]
