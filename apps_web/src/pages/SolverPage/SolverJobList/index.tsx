/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { useMemo, type FunctionComponent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Header, Pagination, SpaceBetween, Table } from '@cloudscape-design/components'
import { useSolverJobQueryContext } from '../../../contexts/SolverJobQueryContext'
import { columnDefinitions as buildColumns } from './table-columns'
import { useCollectionList } from '../../../utils/useCollectionList'
import TablePreferences from '../../../components/TablePreferences'
import type { SolverJobData } from '../../../models'

export const SolverJobList: FunctionComponent = () => {
  const navigate = useNavigate()
  const [{ items, isLoading }, { refreshItems }] = useSolverJobQueryContext()
  const columnDefinitions = useMemo(() => buildColumns(navigate), [navigate])

  const { pageItems, pagination, preferences, sorting } = useCollectionList<SolverJobData>({
    items,
    columnDefinitions,
    defaultSort: { field: 'createdAt', descending: true },
  })

  return (
    <Table
      header={
        <Header
          counter={`(${items.length})`}
          actions={
            <SpaceBetween direction='horizontal' size='xs'>
              <Button iconName='refresh' onClick={() => refreshItems()} ariaLabel='Refresh' />
            </SpaceBetween>
          }
        >
          Solver Job List
        </Header>
      }
      columnDefinitions={columnDefinitions}
      items={pageItems}
      loading={isLoading}
      loadingText='Loading solver jobs'
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
      empty='No solver jobs'
    />
  )
}
