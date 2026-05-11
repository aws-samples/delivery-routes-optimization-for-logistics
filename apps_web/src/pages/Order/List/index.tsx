/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { useMemo, type FunctionComponent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Header, Pagination, SpaceBetween, Table } from '@cloudscape-design/components'
import { useOrderContext } from '../../../contexts/OrderQueryContext'
import { appvars } from '../../../config'
import { columnDefinitions as buildColumns } from './table-columns'
import { useCollectionList } from '../../../utils/useCollectionList'
import TablePreferences from '../../../components/TablePreferences'
import type { OrderData } from '../../../models'

export const List: FunctionComponent = () => {
  const navigate = useNavigate()
  const [{ items, isLoading }, { refreshItems }] = useOrderContext()
  const columnDefinitions = useMemo(() => buildColumns(navigate), [navigate])

  // Legacy table used a two-level sort: orderDate DESC then orderNo ASC.
  const { pageItems, pagination, preferences, sorting } = useCollectionList<OrderData>({
    items,
    columnDefinitions,
    defaultSort: { field: 'orderDate', descending: true },
    secondarySort: { field: 'orderNo', descending: false },
  })

  return (
    <Table
      header={
        <Header
          counter={`(${items.length})`}
          actions={
            <SpaceBetween direction='horizontal' size='xs'>
              <Button iconName='refresh' onClick={() => refreshItems()} ariaLabel='Refresh' />
              <Button variant='primary' onClick={() => navigate(`/${appvars.URL.ORDER}/new`)}>
                New Order
              </Button>
            </SpaceBetween>
          }
        >
          Order List
        </Header>
      }
      columnDefinitions={columnDefinitions}
      items={pageItems}
      loading={isLoading}
      loadingText='Loading orders'
      sortingColumn={sorting.sortingColumn}
      sortingDescending={sorting.sortingDescending}
      onSortingChange={({ detail }) => sorting.onSortingChange(detail)}
      pagination={
        <Pagination
          currentPageIndex={pagination.currentPageIndex}
          pagesCount={pagination.pagesCount}
          onChange={({ detail }) => pagination.onChange(detail)}
        />
      }
      preferences={
        <TablePreferences
          pageSize={preferences.pageSize}
          onPageSizeChange={preferences.setPageSize}
          pageSizeOptions={preferences.pageSizeOptions}
        />
      }
      variant='full-page'
      stickyHeader
      empty='No orders'
    />
  )
}
