/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import type { TableProps } from '@cloudscape-design/components'
import { Link } from '@cloudscape-design/components'
import type { NavigateFunction } from 'react-router-dom'
import type { OrderData } from '../../../models'
import { appvars } from '../../../config'

export const columnDefinitions = (
  navigate: NavigateFunction,
): TableProps.ColumnDefinition<OrderData>[] => [
  {
    id: 'orderNo',
    header: 'Order No',
    sortingField: 'orderNo',
    width: 160,
    cell: (item) => (
      <Link
        href={`/${appvars.URL.ORDER}/${item.Id}`}
        onFollow={(e) => {
          e.preventDefault()
          navigate(`/${appvars.URL.ORDER}/${item.Id}`)
        }}
      >
        {item.orderNo}
      </Link>
    ),
  },
  { id: 'orderDate', header: 'Order Date', sortingField: 'orderDate', width: 150, cell: (i) => i.orderDate },
  { id: 'warehouseCode', header: 'Warehouse Code', sortingField: 'warehouseCode', width: 150, cell: (i) => i.warehouseCode },
  { id: 'deliveryCode', header: 'Delivery Code', sortingField: 'deliveryCode', width: 150, cell: (i) => i.deliveryCode },
  { id: 'deliveryName', header: 'Delivery Name', sortingField: 'deliveryName', width: 350, cell: (i) => i.deliveryName },
  { id: 'sumWeight', header: 'Total Weight', sortingField: 'sumWeight', width: 150, cell: (i) => i.sumWeight },
]
