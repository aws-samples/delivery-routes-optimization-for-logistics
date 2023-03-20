/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { FunctionComponent, useCallback, useState } from 'react'
import {
  Button,
  Column,
  ColumnLayout,
  Inline,
  Stack,
  Text,
  DeleteConfirmationDialog,
  Container,
  KeyValuePair,
  Checkbox,
} from 'aws-northstar'
import { useHistory, useParams } from 'react-router-dom'
import NotFound from '../../../components/NotFound'
import { useOrderContext } from '../../../contexts/OrderQueryContext'
import { appvars } from '../../../config'
import { dayjsutc } from '../../../utils/dayjs'

export const Details: FunctionComponent = () => {
  const history = useHistory()

  const { orderId } = useParams<{ orderId: string }>()
  const [{ items: ortderItems }, { deleteItem }] = useOrderContext()
  const currentItem = ortderItems.find((x) => x.Id === orderId)

  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false)

  const onDeleteClick = useCallback(async () => {
    setShowDeleteModal(true)
  }, [])

  const onEditClick = useCallback(() => {
    if (currentItem == null) {
      throw new Error('VehicleData is null')
    }

    history.push(`/${appvars.URL.ORDER}/${currentItem.Id}/edit`)
  }, [currentItem, history])

  const proceedWithDelete = useCallback(async () => {
    if (currentItem == null) {
      throw new Error('VehicleData is null')
    }

    await deleteItem(currentItem.Id)
    history.push(`/${appvars.URL.ORDER}`)
  }, [deleteItem, history, currentItem])

  if (currentItem == null) {
    return <NotFound what={'Order data'} backUrl={appvars.URL.ORDER} />
  }

  const actionGroup = (
    <Inline>
      <Button onClick={onDeleteClick}>Delete</Button>
      <Button variant='primary' onClick={onEditClick}>
        Edit details
      </Button>
    </Inline>
  )

  return (
    <>
      <DeleteConfirmationDialog
        variant='confirmation'
        visible={showDeleteModal}
        title={`Delete `}
        onCancelClicked={() => setShowDeleteModal(false)}
        onDeleteClicked={proceedWithDelete}
      >
        <>
          <Text>
            Are you sure you want to delete <b>{``}</b>?
          </Text>
        </>
      </DeleteConfirmationDialog>
      <Container
        headingVariant='h1'
        title={`Order (${currentItem.orderNo} - ${currentItem.deliveryCode} - ${currentItem.deliveryName})`}
        actionGroup={actionGroup}
      >
        <Stack>
          <Container headingVariant='h3' title='Details'>
            <ColumnLayout>
              <Column key='col1'>
                <Stack>
                  <KeyValuePair label='Id' value={currentItem.Id} />
                </Stack>
              </Column>
              <Column key='col2'>
                <Stack>
                  <KeyValuePair label='Order No' value={currentItem.orderNo} />
                </Stack>
              </Column>
              <Column key='col3'>
                <Stack>
                  <KeyValuePair label='Customer ID' value={currentItem.deliveryCode} />
                </Stack>
              </Column>
              <Column key='col4'>
                <Stack>
                  <KeyValuePair label='Customer Name' value={currentItem.deliveryName} />
                </Stack>
              </Column>
            </ColumnLayout>
          </Container>
          <Container>
            <ColumnLayout>
              <Column key='col1'>
                <Stack>
                  <KeyValuePair label='Weight' value={currentItem.sumWeight} />
                </Stack>
              </Column>
            </ColumnLayout>
          </Container>
        </Stack>
      </Container>
    </>
  )
}
