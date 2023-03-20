/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { Link } from 'aws-northstar'
import { Column, Cell } from 'react-table'
import { dayjslocal } from '../../../utils/dayjs'
import { appvars } from '../../../config'
import { SolverJobData } from '../../../models'

export const columnDefinitions: Column<SolverJobData>[] = [
  {
    id: 'orderDate',
    width: 200,
    Header: 'Order Date',
    accessor: 'orderDate',
    Cell: ({ row }: Cell<SolverJobData>): any => {
      if (row && row.original) {
        const { Id } = row.original
        const { orderDate } = row.original

        return (
          <Link underlineHover={false} href={`/${appvars.URL.SOLVER_JOB}/${Id}`}>
            {orderDate}
          </Link>
        )
      }

      return row.id
    },
  },
  {
    id: 'warehouseCode',
    width: 200,
    Header: 'Warehouse Code',
    accessor: 'warehouseCode',
  },
  {
    id: 'warehouseName',
    width: 200,
    Header: 'Warehouse Name',
    accessor: 'warehouseName',
  },
  {
    id: 'orderCount',
    width: 200,
    Header: 'Order Count',
    accessor: 'orderCount',
  },
  {
    id: 'solverDurationInMs',
    width: 200,
    Header: 'SolveTime(ms)',
    accessor: 'solverDurationInMs',
    Cell: ({ row }: Cell<SolverJobData>): any => {
      if (row && row.original) {
        const { solverDurationInMs } = row.original

        let sec = Math.ceil(solverDurationInMs / 1000)

        if (sec === 0) {
          return `0.${solverDurationInMs}s`
        } else {
          const min = Math.floor(sec / 60)
          sec = sec % 60

          return (min > 0 ? `${min}m ` : '') + `${sec}s`
        }
      }

      return row.id
    },
  },
  {
    id: 'state',
    width: 150,
    Header: 'Status',
    accessor: 'state',
  },
  {
    id: 'createdAt',
    width: 160,
    Header: 'Created',
    accessor: 'createdAt',
    Cell: ({ row }: Cell<SolverJobData>): any => {
      if (row && row.original) {
        const { createdAt } = row.original

        return dayjslocal(createdAt).format(appvars.DATETIMEFORMAT)
      }

      return row.id
    },
  },
]
