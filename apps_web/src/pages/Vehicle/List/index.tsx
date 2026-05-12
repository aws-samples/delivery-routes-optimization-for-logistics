/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { useMemo, type FunctionComponent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Header, Pagination, SpaceBetween, Table } from '@cloudscape-design/components'
import { useVehicleContext } from '../../../contexts/VehicleContext'
import { appvars } from '../../../config'
import { columnDefinitions as buildColumns } from './table-columns'
import { useCollectionList } from '../../../utils/useCollectionList'
import TablePreferences from '../../../components/TablePreferences'
import type { VehicleData } from '../../../models'

export const List: FunctionComponent = () => {
  const navigate = useNavigate()
  const [{ items, isLoading }, { refreshItems }] = useVehicleContext()
  const columnDefinitions = useMemo(() => buildColumns(navigate), [navigate])

  const { pageItems, pagination, preferences, sorting } = useCollectionList<VehicleData>({
    items,
    columnDefinitions,
    defaultSort: { field: 'carNo', descending: false },
  })

  return (
    <Table
      header={
        <Header
          counter={`(${items.length})`}
          actions={
            <SpaceBetween direction='horizontal' size='xs'>
              <Button iconName='refresh' onClick={() => refreshItems()} ariaLabel='Refresh' />
              <Button variant='primary' onClick={() => navigate(`/${appvars.URL.VEHICLE}/new`)}>
                New Vehicle
              </Button>
            </SpaceBetween>
          }
        >
          Vehicle List
        </Header>
      }
      columnDefinitions={columnDefinitions}
      items={pageItems}
      loading={isLoading}
      loadingText='Loading vehicles'
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
      empty='No vehicles'
    />
  )
}
