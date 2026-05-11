/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { useMemo, useState, type FunctionComponent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  FormField,
  Header,
  Input,
  Modal,
  Pagination,
  SpaceBetween,
  Table,
} from '@cloudscape-design/components'
import { useDistanceCacheContext } from '../../../contexts/DistanceCacheContext'
import NextDayDelivery from '../../../api/NextDayDelivery'
import { columnDefinitions as buildColumns } from './table-columns'
import { useCollectionList } from '../../../utils/useCollectionList'
import TablePreferences from '../../../components/TablePreferences'
import type { DistanceCacheData } from '../../../models'

export const List: FunctionComponent = () => {
  const navigate = useNavigate()
  const [{ items, isLoading }, { refreshItems }] = useDistanceCacheContext()
  const columnDefinitions = useMemo(() => buildColumns(navigate), [navigate])

  const { pageItems, pagination, preferences, sorting } = useCollectionList<DistanceCacheData>({
    items,
    columnDefinitions,
    defaultSort: { field: 'buildTime', descending: true },
  })

  const [modalBuildOpen, setModalBuildOpen] = useState(false)
  const [modalResultOpen, setModalResultOpen] = useState(false)
  const [reqWarehouseCode, setReqWarehouseCode] = useState('')
  const [rebuilding, setRebuilding] = useState(false)

  const buildDistanceCache = async () => {
    setRebuilding(true)
    try {
      const result = await NextDayDelivery.buildDistanceCache(reqWarehouseCode)
      console.log(result)
      setModalBuildOpen(false)
      setModalResultOpen(true)
    } catch (e) {
      console.log(e)
    } finally {
      setRebuilding(false)
    }
  }

  return (
    <>
      <Modal
        visible={modalBuildOpen}
        onDismiss={() => { if (!rebuilding) setModalBuildOpen(false) }}
        header='Rebuild Distance Cache'
        footer={
          <Box float='right'>
            <SpaceBetween direction='horizontal' size='xs'>
              <Button variant='link' onClick={() => setModalBuildOpen(false)} disabled={rebuilding}>
                Cancel
              </Button>
              <Button variant='primary' onClick={buildDistanceCache} loading={rebuilding}>
                Rebuild
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <FormField label='Warehouse Code' controlId='ctlWarehouseCode'>
          <Input
            value={reqWarehouseCode}
            placeholder='Warehouse Code'
            onChange={({ detail }) => setReqWarehouseCode(detail.value)}
          />
        </FormField>
      </Modal>

      <Modal
        visible={modalResultOpen}
        onDismiss={() => setModalResultOpen(false)}
        header='Rebuild Distance Cache'
        footer={
          <Box float='right'>
            <Button onClick={() => setModalResultOpen(false)}>Close</Button>
          </Box>
        }
      >
        Distance cache rebuild job is requested.
      </Modal>

      <Table
        header={
          <Header
            counter={`(${items.length})`}
            actions={
              <SpaceBetween direction='horizontal' size='xs'>
                <Button iconName='refresh' onClick={() => refreshItems()} ariaLabel='Refresh' />
                <Button onClick={() => setModalBuildOpen(true)}>Rebuild DistanceCache</Button>
              </SpaceBetween>
            }
          >
            DistanceCache List
          </Header>
        }
        columnDefinitions={columnDefinitions}
        items={pageItems}
        loading={isLoading}
        loadingText='Loading distance caches'
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
        empty='No distance caches'
      />
    </>
  )
}
