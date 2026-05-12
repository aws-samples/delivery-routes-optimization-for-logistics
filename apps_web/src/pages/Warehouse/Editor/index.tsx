/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { useCallback, useState, type FormEvent, type FunctionComponent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Button,
  ColumnLayout,
  Container,
  Form,
  FormField,
  Header,
  Input,
  SpaceBetween,
} from '@cloudscape-design/components'
import { v4 as uuid } from 'uuid'
import { useImmer } from 'use-immer'
import type { Draft } from 'immer'
import { EMPTY_WAREHOUSE, type WarehouseData } from '../../../models'
import { useWarehouseContext } from '../../../contexts/WarehouseContext'
import { appvars } from '../../../config'
import { dayjsutc } from '../../../utils/dayjs'

export const Editor: FunctionComponent = () => {
  const navigate = useNavigate()
  const { warehouseId } = useParams<{ warehouseId: string }>()
  const [{ items: warehouseItems }, { updateItem, createItem }] = useWarehouseContext()

  const editMode = !(warehouseId === undefined)
  const [warehouseData, updateWarehouseData] = useImmer<WarehouseData>(() => {
    if (editMode && warehouseItems != null) {
      const sel = warehouseItems.find((x) => x.Id === warehouseId)
      if (sel != null) {
        return sel
      }
    }
    return { ...EMPTY_WAREHOUSE, Id: uuid() }
  })
  const [formError, setFormError] = useState<string>()

  const onSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      try {
        if (editMode) {
          updateItem(warehouseData, true)
        } else {
          await createItem(warehouseData)
        }
        navigate(`/${appvars.URL.WAREHOUSE}/${warehouseData.Id}`)
      } catch (err) {
        setFormError(`Error while ${editMode ? 'updating' : 'saving new'} warehouse object: ${err}`)
      }
    },
    [warehouseData, navigate, updateItem, createItem, editMode],
  )

  const onCancel = () => {
    navigate(editMode ? `/${appvars.URL.WAREHOUSE}/${warehouseData.Id}` : `/${appvars.URL.WAREHOUSE}`)
  }

  const setField = <K extends keyof WarehouseData>(key: K, value: WarehouseData[K]) => {
    updateWarehouseData((draft: Draft<WarehouseData>) => {
      draft[key] = value
    })
  }

  return (
    <form onSubmit={onSubmit}>
      <Form
        header={<Header variant='h1'>{editMode ? 'Edit warehouse' : 'New warehouse'}</Header>}
        errorText={formError}
        actions={
          <SpaceBetween direction='horizontal' size='xs'>
            <Button variant='link' formAction='none' onClick={onCancel}>
              Cancel
            </Button>
            <Button variant='primary'>Save</Button>
          </SpaceBetween>
        }
      >
        <Container header={<Header variant='h2'>Warehouse Details</Header>}>
          <SpaceBetween size='l'>
            <ColumnLayout columns={2}>
              <FormField label='Id' controlId='field_Id'>
                <Input value={warehouseData.Id} disabled />
              </FormField>
              <FormField label='Created' controlId='field_Created'>
                <Input value={dayjsutc(warehouseData.createdAt).format(appvars.DATETIMEFORMAT)} disabled />
              </FormField>
              <FormField label='Warehouse Code' controlId='field_warehouseCode'>
                <Input
                  value={warehouseData.warehouseCode}
                  onChange={({ detail }) => setField('warehouseCode', detail.value)}
                  placeholder='Warehouse code'
                />
              </FormField>
              <FormField label='Warehouse Name' controlId='field_warehouseName'>
                <Input
                  value={warehouseData.warehouseName}
                  onChange={({ detail }) => setField('warehouseName', detail.value)}
                  placeholder='Warehouse name'
                />
              </FormField>
              <FormField label='Latitude' controlId='field_Latitude'>
                <Input
                  type='number'
                  value={String(warehouseData.latitude)}
                  onChange={({ detail }) => setField('latitude', parseFloat(detail.value))}
                  placeholder='Warehouse latitude'
                />
              </FormField>
              <FormField label='Longitude' controlId='field_Longitude'>
                <Input
                  type='number'
                  value={String(warehouseData.longitude)}
                  onChange={({ detail }) => setField('longitude', parseFloat(detail.value))}
                  placeholder='Warehouse longitude'
                />
              </FormField>
              <FormField label='Address' controlId='field_Address'>
                <Input
                  value={warehouseData.address}
                  onChange={({ detail }) => setField('address', detail.value)}
                  placeholder='Warehouse address'
                />
              </FormField>
            </ColumnLayout>
          </SpaceBetween>
        </Container>
      </Form>
    </form>
  )
}
