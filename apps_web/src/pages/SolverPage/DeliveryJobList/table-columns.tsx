/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import type { TableProps } from '@cloudscape-design/components'
import type { DeliveryJobData, selectDeliveryJobData } from '../../../models'
import { dayjslocal } from '../../../utils/dayjs'
import { appvars } from '../../../config'

export const columnDefinitions: TableProps.ColumnDefinition<DeliveryJobData>[] = [
  { id: 'carNo', header: 'Car No.', sortingField: 'carNo', width: 120, cell: (i) => i.carNo },
  { id: 'deliveryTimeGroup', header: 'Time Group', sortingField: 'deliveryTimeGroup', width: 120, cell: (i) => i.deliveryTimeGroup },
  {
    id: 'orderCount',
    header: 'Order Count',
    width: 120,
    cell: (i) => (Array.isArray(i.segments) ? i.segments.length : 0),
  },
  { id: 'loadCapacity', header: 'Load Weight', sortingField: 'loadCapacity', width: 150, cell: (i) => i.loadCapacity },
  { id: 'maxCapacity', header: 'Max Capacity', sortingField: 'maxCapacity', width: 150, cell: (i) => i.maxCapacity },
  {
    id: 'createdAt',
    header: 'Created',
    sortingField: 'createdAt',
    width: 200,
    cell: (i) => dayjslocal(i.createdAt).format(appvars.DATETIMEFORMAT),
  },
]

export const columnDefinitionsSegments: TableProps.ColumnDefinition<selectDeliveryJobData>[] = [
  { id: 'deliveryCode', header: 'Customer ID', width: 150, cell: (i) => i.deliveryCode },
  { id: 'deliveryName', header: 'Customer Name', width: 200, cell: (i) => i.deliveryName },
  { id: 'deliveryTimeGroup', header: 'Time Group', width: 120, cell: (i) => i.deliveryTimeGroup },
  { id: 'demands', header: 'Order Weight', width: 150, cell: (i) => i.demands },
]
