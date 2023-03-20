/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { Link } from 'aws-northstar'
import { Column, Cell } from 'react-table'
import { appvars } from '../../../config'
import { OrderData } from '../../../models'

export const columnDefinitions: Column<OrderData>[] = [
  {
    id: 'orderNo',
    width: 150,
    Header: '주문번호',
    accessor: 'orderNo',
    Cell: ({ row }: Cell<OrderData>): any => {
      if (row && row.original) {
        const { Id } = row.original
        const { orderNo } = row.original

        return (
          <Link underlineHover={false} href={`/${appvars.URL.ORDER}/${Id}`}>
            {orderNo}
          </Link>
        )
      }

      return row.id
    },
  },
  {
    id: 'orderDate',
    width: 150,
    Header: '주문일자',
    accessor: 'orderDate',
  },
  {
    id: 'warehouseCode',
    width: 150,
    Header: '물류창고코드',
    accessor: 'warehouseCode',
  },
  {
    id: 'deliveryCode',
    width: 150,
    Header: '거래처코드',
    accessor: 'deliveryCode',
  },
  {
    id: 'deliveryName',
    width: 350,
    Header: '거래처명',
    accessor: 'deliveryName',
  },
  {
    id: 'sumWeight',
    width: 150,
    Header: '중량합계',
    accessor: 'sumWeight',
  },
]
