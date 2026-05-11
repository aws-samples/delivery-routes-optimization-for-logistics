/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { useCallback, useState, type FunctionComponent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Box,
  Button,
  Container,
  Header,
  KeyValuePairs,
  Modal,
  SpaceBetween,
} from '@cloudscape-design/components'
import { useCustomerLocationContext } from '../../../contexts/CustomerLocationContext'
import { appvars } from '../../../config'
import { dayjsutc } from '../../../utils/dayjs'
import NotFound from '../../../components/NotFound'
import MapComponent from '../../../components/MapComponent'

export const Details: FunctionComponent = () => {
  const navigate = useNavigate()
  const { customerLocationId } = useParams<{ customerLocationId: string }>()
  const [{ items }, { deleteItem }] = useCustomerLocationContext()
  const currentItem = items.find((x) => x.Id === customerLocationId)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const onEditClick = useCallback(() => {
    if (currentItem == null) return
    navigate(`/${appvars.URL.CUSTOMER_LOCATION}/${currentItem.Id}/edit`)
  }, [currentItem, navigate])

  const proceedWithDelete = useCallback(async () => {
    if (currentItem == null) return
    await deleteItem(currentItem.Id)
    navigate(`/${appvars.URL.CUSTOMER_LOCATION}`)
  }, [deleteItem, navigate, currentItem])

  if (currentItem == null) {
    return <NotFound what='Customer location data' backUrl={appvars.URL.CUSTOMER_LOCATION} />
  }

  return (
    <SpaceBetween size='l'>
      <Modal
        visible={showDeleteModal}
        onDismiss={() => setShowDeleteModal(false)}
        header={`Delete ${currentItem.deliveryCode} (${currentItem.Id})`}
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
        Are you sure you want to delete <b>{currentItem.deliveryCode}</b>?
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
        Customer ({currentItem.deliveryName} [{currentItem.deliveryCode}])
      </Header>

      <Container header={<Header variant='h2'>Details</Header>}>
        <KeyValuePairs
          columns={3}
          items={[
            { label: 'Id', value: currentItem.Id },
            { label: 'Customer ID', value: currentItem.deliveryCode },
            { label: 'Name', value: currentItem.deliveryName },
            { label: 'Warehouse Code', value: currentItem.warehouseCode },
            { label: 'Created', value: dayjsutc(currentItem.createdAt).utc().format(appvars.DATETIMEFORMAT) },
            { label: 'Updated', value: dayjsutc(currentItem.updatedAt).format(appvars.DATETIMEFORMAT) },
          ]}
        />
      </Container>

      <Container header={<Header variant='h2'>Location</Header>}>
        <KeyValuePairs
          columns={2}
          items={[
            { label: 'Address', value: currentItem.address },
            { label: 'Geo-Location', value: `${currentItem.latitude}, ${currentItem.longitude}` },
          ]}
        />
        <Box padding={{ top: 'l' }}>
          <MapComponent customers={[currentItem]} />
        </Box>
      </Container>
    </SpaceBetween>
  )
}
