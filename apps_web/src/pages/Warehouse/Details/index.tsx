/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { useCallback, useState, type FunctionComponent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Box,
  Button,
  ColumnLayout,
  Container,
  Header,
  KeyValuePairs,
  Modal,
  SpaceBetween,
} from '@cloudscape-design/components'
import { useWarehouseContext } from '../../../contexts/WarehouseContext'
import { appvars } from '../../../config'
import { dayjsutc } from '../../../utils/dayjs'
import NotFound from '../../../components/NotFound'
import MapComponent from '../../../components/MapComponent'

export const Details: FunctionComponent = () => {
  const navigate = useNavigate()
  const { warehouseId } = useParams<{ warehouseId: string }>()
  const [{ items: warehouseItems }, { deleteItem }] = useWarehouseContext()
  const currentItem = warehouseItems.find((x) => x.Id === warehouseId)

  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const onEditClick = useCallback(() => {
    if (currentItem == null) return
    navigate(`/${appvars.URL.WAREHOUSE}/${currentItem.Id}/edit`)
  }, [currentItem, navigate])

  const proceedWithDelete = useCallback(async () => {
    if (currentItem == null) return
    await deleteItem(currentItem.Id)
    navigate(`/${appvars.URL.WAREHOUSE}`)
  }, [deleteItem, navigate, currentItem])

  if (currentItem == null) {
    return <NotFound what='Warehouse data' backUrl={appvars.URL.WAREHOUSE} />
  }

  return (
    <SpaceBetween size='l'>
      <Modal
        visible={showDeleteModal}
        onDismiss={() => setShowDeleteModal(false)}
        header={`Delete ${currentItem.warehouseCode} (${currentItem.Id})`}
        footer={
          <Box float='right'>
            <SpaceBetween direction='horizontal' size='xs'>
              <Button variant='link' onClick={() => setShowDeleteModal(false)}>
                Cancel
              </Button>
              <Button variant='primary' onClick={proceedWithDelete}>
                Delete
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        Are you sure you want to delete <b>{currentItem.warehouseCode}</b>?
      </Modal>

      <Header
        variant='h1'
        actions={
          <SpaceBetween direction='horizontal' size='xs'>
            <Button onClick={() => setShowDeleteModal(true)}>Delete</Button>
            <Button variant='primary' onClick={onEditClick}>
              Edit details
            </Button>
          </SpaceBetween>
        }
      >
        Warehouse ({currentItem.warehouseName})
      </Header>

      <Container header={<Header variant='h2'>Details</Header>}>
        <ColumnLayout columns={4} variant='text-grid'>
          <KeyValuePairs columns={1} items={[{ label: 'Id', value: currentItem.Id }]} />
          <KeyValuePairs columns={1} items={[{ label: 'Warehouse Code', value: currentItem.warehouseCode }]} />
          <KeyValuePairs columns={1} items={[{ label: 'Name', value: currentItem.warehouseName }]} />
          <KeyValuePairs
            columns={1}
            items={[
              { label: 'Created', value: dayjsutc(currentItem.createdAt).utc().format(appvars.DATETIMEFORMAT) },
              { label: 'Updated', value: dayjsutc(currentItem.updatedAt).format(appvars.DATETIMEFORMAT) },
            ]}
          />
        </ColumnLayout>
      </Container>

      <Container header={<Header variant='h2'>Location</Header>}>
        <ColumnLayout columns={2} variant='text-grid'>
          <KeyValuePairs columns={1} items={[{ label: 'Address', value: currentItem.address }]} />
          <KeyValuePairs
            columns={1}
            items={[{ label: 'Geo-Location', value: `${currentItem.latitude}, ${currentItem.longitude}` }]}
          />
        </ColumnLayout>
        <Box padding={{ top: 'l' }}>
          <MapComponent warehouses={[currentItem]} />
        </Box>
      </Container>
    </SpaceBetween>
  )
}
