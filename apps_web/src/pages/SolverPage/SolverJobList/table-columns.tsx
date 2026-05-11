/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import type { TableProps } from '@cloudscape-design/components'
import { Link } from '@cloudscape-design/components'
import type { NavigateFunction } from 'react-router-dom'
import type { SolverJobData } from '../../../models'
import { dayjslocal } from '../../../utils/dayjs'
import { appvars } from '../../../config'

const formatSolveTime = (ms: number): string => {
  let sec = Math.ceil(ms / 1000)
  if (sec === 0) {
    return `0.${ms}s`
  }
  const min = Math.floor(sec / 60)
  sec = sec % 60
  return (min > 0 ? `${min}m ` : '') + `${sec}s`
}

export const columnDefinitions = (
  navigate: NavigateFunction,
): TableProps.ColumnDefinition<SolverJobData>[] => [
  {
    id: 'orderDate',
    header: 'Order Date',
    sortingField: 'orderDate',
    width: 200,
    cell: (item) => (
      <Link
        href={`/${appvars.URL.SOLVER_JOB}/${item.Id}`}
        onFollow={(e) => {
          e.preventDefault()
          navigate(`/${appvars.URL.SOLVER_JOB}/${item.Id}`)
        }}
      >
        {item.orderDate}
      </Link>
    ),
  },
  { id: 'warehouseCode', header: 'Warehouse Code', sortingField: 'warehouseCode', width: 200, cell: (i) => i.warehouseCode },
  { id: 'warehouseName', header: 'Warehouse Name', sortingField: 'warehouseName', width: 200, cell: (i) => i.warehouseName },
  { id: 'orderCount', header: 'Order Count', sortingField: 'orderCount', width: 150, cell: (i) => i.orderCount },
  {
    id: 'solverDurationInMs',
    header: 'SolveTime(ms)',
    sortingField: 'solverDurationInMs',
    width: 200,
    cell: (i) => formatSolveTime(i.solverDurationInMs),
  },
  { id: 'state', header: 'Status', sortingField: 'state', width: 150, cell: (i) => i.state },
  {
    id: 'createdAt',
    header: 'Created',
    sortingField: 'createdAt',
    width: 200,
    cell: (i) => dayjslocal(i.createdAt).format(appvars.DATETIMEFORMAT),
  },
]
