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
import { useVehicleContext } from '../../../contexts/VehicleContext'
import { appvars } from '../../../config'
import { dayjsutc } from '../../../utils/dayjs'

export const Details: FunctionComponent = () => {
  const history = useHistory()

  const { vehicleId } = useParams<{ vehicleId: string }>()
  const [{ items: vehicleItems }, { deleteItem }] = useVehicleContext()
  const currentItem = vehicleItems.find((x) => x.Id === vehicleId)

  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false)

  const onDeleteClick = useCallback(async () => {
    setShowDeleteModal(true)
  }, [])

  const onEditClick = useCallback(() => {
    if (currentItem == null) {
      throw new Error('VehicleData is null')
    }

    history.push(`/${appvars.URL.VEHICLE}/${currentItem.Id}/edit`)
  }, [currentItem, history])

  const proceedWithDelete = useCallback(async () => {
    if (currentItem == null) {
      throw new Error('VehicleData is null')
    }

    await deleteItem(currentItem.Id)
    history.push(`/${appvars.URL.VEHICLE}`)
  }, [deleteItem, history, currentItem])

  if (currentItem == null) {
    return <NotFound what={'Vehicle data'} backUrl={appvars.URL.VEHICLE} />
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
        title={`Delete ${currentItem.carNo} - ${currentItem.carGrade}`}
        onCancelClicked={() => setShowDeleteModal(false)}
        onDeleteClicked={proceedWithDelete}
      >
        <>
          <Text>
            Are you sure you want to delete <b>{`${currentItem.carNo} - ${currentItem.carGrade}`}</b>?
          </Text>
        </>
      </DeleteConfirmationDialog>

      <Container
        headingVariant='h1'
        title={`Vehicle (${currentItem.carNo} - ${currentItem.carGrade})`}
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
                  <KeyValuePair label='Car No.' value={currentItem.carNo} />
                </Stack>
              </Column>
              <Column key='col3'>
                <Stack>
                  <KeyValuePair label='Department(Warehouse)' value={currentItem.warehouseCode} />
                </Stack>
              </Column>
              <Column key='col4'>
                <Stack>
                  <KeyValuePair label='Grade' value={currentItem.carGrade} />
                </Stack>
              </Column>
              <Column key='col5'>
                <Stack>
                  <KeyValuePair label='Max Capacity' value={currentItem.maxWeight} />
                </Stack>
              </Column>
            </ColumnLayout>
          </Container>
        </Stack>
      </Container>
    </>
  )
}
