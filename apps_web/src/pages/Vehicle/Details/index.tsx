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
import { useVehicleContext } from '../../../contexts/VehicleContext'
import { appvars } from '../../../config'
import NotFound from '../../../components/NotFound'

export const Details: FunctionComponent = () => {
  const navigate = useNavigate()
  const { vehicleId } = useParams<{ vehicleId: string }>()
  const [{ items: vehicleItems }, { deleteItem }] = useVehicleContext()
  const currentItem = vehicleItems.find((x) => x.Id === vehicleId)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const onEditClick = useCallback(() => {
    if (currentItem == null) return
    navigate(`/${appvars.URL.VEHICLE}/${currentItem.Id}/edit`)
  }, [currentItem, navigate])

  const proceedWithDelete = useCallback(async () => {
    if (currentItem == null) return
    await deleteItem(currentItem.Id)
    navigate(`/${appvars.URL.VEHICLE}`)
  }, [deleteItem, navigate, currentItem])

  if (currentItem == null) {
    return <NotFound what='Vehicle data' backUrl={appvars.URL.VEHICLE} />
  }

  return (
    <SpaceBetween size='l'>
      <Modal
        visible={showDeleteModal}
        onDismiss={() => setShowDeleteModal(false)}
        header={`Delete ${currentItem.carNo} - ${currentItem.carGrade}`}
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
        Are you sure you want to delete{' '}
        <b>
          {currentItem.carNo} - {currentItem.carGrade}
        </b>
        ?
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
        Vehicle ({currentItem.carNo} - {currentItem.carGrade})
      </Header>

      <Container header={<Header variant='h2'>Details</Header>}>
        <KeyValuePairs
          columns={3}
          items={[
            { label: 'Id', value: currentItem.Id },
            { label: 'Car No.', value: currentItem.carNo },
            { label: 'Department (Warehouse)', value: currentItem.warehouseCode },
            { label: 'Grade', value: currentItem.carGrade },
            { label: 'Max Capacity', value: currentItem.maxWeight },
          ]}
        />
      </Container>
    </SpaceBetween>
  )
}
