/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { Link } from 'aws-northstar'
import { Column, Cell } from 'react-table'
import { dayjslocal } from '../../../utils/dayjs'
import { appvars } from '../../../config'
import { DeliveryJobData, selectDeliveryJobData } from '../../../models'

export const columnDefinitions: Column<DeliveryJobData>[] = [
  {
    id: 'carNo',
    width: 100,
    Header: 'Car No.',
    accessor: 'carNo',
  },
  {
    id: 'deliveryTimeGroup',
    width: 100,
    Header: 'Time Group',
    accessor: 'deliveryTimeGroup',
  },
  {
    id: 'orderCount',
    width: 100,
    Header: 'Order Count',
    accessor: 'segments',
    Cell: ({ row }: Cell<DeliveryJobData>): any => {
      if (row && row.original) {
        return row.original.segments.length
      }

      return 0
    },
  },
  {
    id: 'loadCapacity',
    width: 150,
    Header: 'Load Weight',
    accessor: 'loadCapacity',
  },
  {
    id: 'maxCapacity',
    width: 150,
    Header: 'Max Capacity',
    accessor: 'maxCapacity',
  },
  {
    id: 'createdAt',
    width: 160,
    Header: 'Created',
    accessor: 'createdAt',
    Cell: ({ row }: Cell<DeliveryJobData>): any => {
      if (row && row.original) {
        const { createdAt } = row.original

        return dayjslocal(createdAt).format(appvars.DATETIMEFORMAT)
      }

      return row.id
    },
  },
]
export const columnDefinitions1: Column<selectDeliveryJobData>[] = [
  {
    id: 'deliveryCode',
    width: 150,
    Header: 'Customer ID',
    accessor: 'deliveryCode',
  },
  {
    id: 'deliveryName',
    width: 200,
    Header: 'Customer Name',
    accessor: 'deliveryName',
  },
  {
    id: 'deliveryTimeGroup',
    width: 100,
    Header: 'Time Group',
    accessor: 'deliveryTimeGroup',
  },
  {
    id: 'demands',
    width: 150,
    Header: 'Order Weight',
    accessor: 'demands',
  },
]
