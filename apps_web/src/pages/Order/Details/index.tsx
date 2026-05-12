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
import { useOrderContext } from '../../../contexts/OrderQueryContext'
import { appvars } from '../../../config'
import NotFound from '../../../components/NotFound'

export const Details: FunctionComponent = () => {
  const navigate = useNavigate()
  const { orderId } = useParams<{ orderId: string }>()
  const [{ items }, { deleteItem }] = useOrderContext()
  const currentItem = items.find((x) => x.Id === orderId)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const onEditClick = useCallback(() => {
    if (currentItem == null) return
    navigate(`/${appvars.URL.ORDER}/${currentItem.Id}/edit`)
  }, [currentItem, navigate])

  const proceedWithDelete = useCallback(async () => {
    if (currentItem == null) return
    await deleteItem(currentItem.Id)
    navigate(`/${appvars.URL.ORDER}`)
  }, [deleteItem, navigate, currentItem])

  if (currentItem == null) {
    return <NotFound what='Order data' backUrl={appvars.URL.ORDER} />
  }

  return (
    <SpaceBetween size='l'>
      <Modal
        visible={showDeleteModal}
        onDismiss={() => setShowDeleteModal(false)}
        header={`Delete order ${currentItem.orderNo}`}
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
        Are you sure you want to delete order <b>{currentItem.orderNo}</b>?
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
        Order ({currentItem.orderNo} - {currentItem.deliveryCode} - {currentItem.deliveryName})
      </Header>

      <Container header={<Header variant='h2'>Details</Header>}>
        <KeyValuePairs
          columns={4}
          items={[
            { label: 'Id', value: currentItem.Id },
            { label: 'Order No', value: currentItem.orderNo },
            { label: 'Customer ID', value: currentItem.deliveryCode },
            { label: 'Customer Name', value: currentItem.deliveryName },
          ]}
        />
      </Container>
      <Container>
        <KeyValuePairs columns={1} items={[{ label: 'Weight', value: currentItem.sumWeight }]} />
      </Container>
    </SpaceBetween>
  )
}
