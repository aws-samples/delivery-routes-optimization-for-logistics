/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import type { TableProps } from '@cloudscape-design/components'
import { Link } from '@cloudscape-design/components'
import type { NavigateFunction } from 'react-router-dom'
import type { CustomerLocationData } from '../../../models'
import { dayjslocal } from '../../../utils/dayjs'
import { appvars } from '../../../config'

export const columnDefinitions = (
  navigate: NavigateFunction,
): TableProps.ColumnDefinition<CustomerLocationData>[] => [
  {
    id: 'deliveryName',
    header: 'Name',
    sortingField: 'deliveryName',
    width: 250,
    cell: (item) => (
      <Link
        href={`/${appvars.URL.CUSTOMER_LOCATION}/${item.Id}`}
        onFollow={(e) => {
          e.preventDefault()
          navigate(`/${appvars.URL.CUSTOMER_LOCATION}/${item.Id}`)
        }}
      >
        {item.deliveryName}
      </Link>
    ),
  },
  {
    id: 'deliveryCode',
    header: 'Customer ID',
    sortingField: 'deliveryCode',
    width: 160,
    cell: (item) => item.deliveryCode,
  },
  {
    id: 'address',
    header: 'Address',
    sortingField: 'address',
    width: 500,
    cell: (item) => item.address,
  },
  {
    id: 'createdAt',
    header: 'Created',
    sortingField: 'createdAt',
    width: 180,
    cell: (item) => dayjslocal(item.createdAt).format(appvars.DATETIMEFORMAT),
  },
  {
    id: 'updatedAt',
    header: 'Updated',
    sortingField: 'updatedAt',
    width: 180,
    cell: (item) => dayjslocal(item.updatedAt).format(appvars.DATETIMEFORMAT),
  },
]
