/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { Link, Checkbox } from 'aws-northstar'
import { Column, Cell } from 'react-table'
import { dayjslocal } from '../../../utils/dayjs'
import { appvars } from '../../../config'
import { CustomerLocationData } from '../../../models'

export const columnDefinitions: Column<CustomerLocationData>[] = [
  {
    id: 'deliveryName',
    width: 250,
    Header: 'Name',
    accessor: 'deliveryName',
    Cell: ({ row }: Cell<CustomerLocationData>): any => {
      if (row && row.original) {
        const { Id } = row.original
        const { deliveryName } = row.original

        return (
          <Link underlineHover={false} href={`/${appvars.URL.CUSTOMER_LOCATION}/${Id}`}>
            {deliveryName}
          </Link>
        )
      }

      return row.id
    },
  },
  {
    id: 'deliveryCode',
    width: 160,
    Header: 'Customer ID',
    accessor: 'deliveryCode',
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
    Cell: ({ row }: Cell<CustomerLocationData>): any => {
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
    Cell: ({ row }: Cell<CustomerLocationData>): any => {
      if (row && row.original) {
        const { updatedAt } = row.original

        return dayjslocal(updatedAt).format(appvars.DATETIMEFORMAT)
      }

      return row.id
    },
  },
]
