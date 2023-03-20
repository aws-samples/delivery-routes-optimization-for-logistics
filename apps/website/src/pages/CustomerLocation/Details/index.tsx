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
} from 'aws-northstar'
import { useHistory, useParams } from 'react-router-dom'
import NotFound from '../../../components/NotFound'
import { useCustomerLocationContext } from '../../../contexts/CustomerLocationContext'
import { appvars } from '../../../config'
import { dayjsutc } from '../../../utils/dayjs'
import MapComponent from '../../../components/MapComponent'

export const Details: FunctionComponent = () => {
  const history = useHistory()

  const { customerLocationId } = useParams<{ customerLocationId: string }>()
  const [{ items: customerLocationItems }, { deleteItem }] = useCustomerLocationContext()
  const currentItem = customerLocationItems.find((x) => x.Id === customerLocationId)

  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false)

  const onDeleteClick = useCallback(async () => {
    setShowDeleteModal(true)
  }, [])

  const onEditClick = useCallback(() => {
    if (currentItem == null) {
      throw new Error('CustomerLocationData is null')
    }

    history.push(`/${appvars.URL.CUSTOMER_LOCATION}/${currentItem.Id}/edit`)
  }, [currentItem, history])

  const proceedWithDelete = useCallback(async () => {
    if (currentItem == null) {
      throw new Error('CustomerLocationData is null')
    }

    await deleteItem(currentItem.Id)
    history.push(`/${appvars.URL.CUSTOMER_LOCATION}`)
  }, [deleteItem, history, currentItem])

  if (currentItem == null) {
    return <NotFound what={'Customer location data'} backUrl={appvars.URL.CUSTOMER_LOCATION} />
  }

  const actionGroup = (
    <Inline>
      <Button onClick={onDeleteClick}>Delete</Button>
      <Button variant='primary' onClick={onEditClick}>
        Edit details
      </Button>
    </Inline>
  )

  const pins = [
    {
      name: currentItem.deliveryName,
      latitude: currentItem.latitude,
      longitude: currentItem.longitude,
    },
  ]
  const mapProps = {
    zoom: 11,
    width: 1000,
    height: 750,
  }

  return (
    <>
      <DeleteConfirmationDialog
        variant='confirmation'
        visible={showDeleteModal}
        title={`Delete ${currentItem.deliveryCode} (${currentItem.Id})`}
        onCancelClicked={() => setShowDeleteModal(false)}
        onDeleteClicked={proceedWithDelete}
      >
        <>
          <Text>
            Are you sure you want to delete <b>{currentItem.deliveryCode}</b>?
          </Text>
        </>
      </DeleteConfirmationDialog>

      <Container
        headingVariant='h1'
        title={`Customer (${currentItem.deliveryName} [${currentItem.deliveryCode}])`}
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
                  <KeyValuePair label='Customer ID' value={currentItem.deliveryCode} />
                </Stack>
              </Column>
              <Column key='col3'>
                <Stack>
                  <KeyValuePair label='Name' value={currentItem.deliveryName} />
                </Stack>
              </Column>
              <Column key='col4'>
                <Stack>
                  <KeyValuePair label='Warehouse Code' value={currentItem.warehouseCode} />
                </Stack>
              </Column>
              <Column key='col5'>
                <Stack>
                  <KeyValuePair
                    label='Created'
                    value={dayjsutc(currentItem.createdAt).utc().format(appvars.DATETIMEFORMAT)}
                  />
                  <KeyValuePair
                    label='Updated'
                    value={dayjsutc(currentItem.updatedAt).format(appvars.DATETIMEFORMAT)}
                  />
                </Stack>
              </Column>
            </ColumnLayout>
          </Container>
          <Container headingVariant='h3' title='Location'>
            <ColumnLayout>
              <Column key='col1'>
                <Stack>
                  <KeyValuePair label='Address' value={currentItem.address} />
                </Stack>
              </Column>
              <Column key='col2'>
                <Stack>
                  <KeyValuePair label='Geo-Location' value={`${currentItem.latitude}, ${currentItem.longitude}`} />
                </Stack>
              </Column>
            </ColumnLayout>
            <br />
            <Stack>
              <MapComponent customers={[currentItem]} />
            </Stack>
          </Container>
        </Stack>
      </Container>
    </>
  )
}
