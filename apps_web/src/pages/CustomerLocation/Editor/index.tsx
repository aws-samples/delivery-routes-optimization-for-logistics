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
import { EMPTY_CUSTOMER_LOCATION, type CustomerLocationData } from '../../../models'
import { useCustomerLocationContext } from '../../../contexts/CustomerLocationContext'
import { appvars } from '../../../config'

export const Editor: FunctionComponent = () => {
  const navigate = useNavigate()
  const { customerLocationId } = useParams<{ customerLocationId: string }>()
  const [{ items }, { updateItem, createItem }] = useCustomerLocationContext()

  const editMode = !(customerLocationId === undefined)
  const [data, update] = useImmer<CustomerLocationData>(() => {
    if (editMode && items != null) {
      const sel = items.find((x) => x.Id === customerLocationId)
      if (sel != null) {
        return sel
      }
    }
    return { ...EMPTY_CUSTOMER_LOCATION, Id: uuid() }
  })
  const [formError, setFormError] = useState<string>()

  const onSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      try {
        if (editMode) {
          updateItem(data, true)
        } else {
          await createItem(data)
        }
        navigate(`/${appvars.URL.CUSTOMER_LOCATION}/${data.Id}`)
      } catch (err) {
        setFormError(`Error while ${editMode ? 'updating' : 'saving new'} customer location object: ${err}`)
      }
    },
    [data, navigate, updateItem, createItem, editMode],
  )

  const onCancel = () => {
    navigate(editMode ? `/${appvars.URL.CUSTOMER_LOCATION}/${data.Id}` : `/${appvars.URL.CUSTOMER_LOCATION}`)
  }

  const setField = <K extends keyof CustomerLocationData>(key: K, value: CustomerLocationData[K]) => {
    update((draft: Draft<CustomerLocationData>) => {
      draft[key] = value
    })
  }

  return (
    <form onSubmit={onSubmit}>
      <Form
        header={<Header variant='h1'>{editMode ? 'Edit customer location' : 'New customer location'}</Header>}
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
        <Container header={<Header variant='h2'>Customer location details</Header>}>
          <ColumnLayout columns={2}>
            <FormField label='Customer ID' controlId='field_DeliveryCode'>
              <Input value={data.deliveryCode} onChange={({ detail }) => setField('deliveryCode', detail.value)} />
            </FormField>
            <FormField label='Name' controlId='field_DeliveryName'>
              <Input value={data.deliveryName} onChange={({ detail }) => setField('deliveryName', detail.value)} />
            </FormField>
            <FormField label='Warehouse Code' controlId='field_warehouseCode'>
              <Input value={data.warehouseCode} onChange={({ detail }) => setField('warehouseCode', detail.value)} />
            </FormField>
            <FormField label='Latitude' controlId='field_Latitude'>
              <Input
                type='number'
                value={String(data.latitude)}
                onChange={({ detail }) => setField('latitude', parseFloat(detail.value))}
              />
            </FormField>
            <FormField label='Longitude' controlId='field_Longitude'>
              <Input
                type='number'
                value={String(data.longitude)}
                onChange={({ detail }) => setField('longitude', parseFloat(detail.value))}
              />
            </FormField>
            <FormField label='Address' controlId='field_Address'>
              <Input value={data.address} onChange={({ detail }) => setField('address', detail.value)} />
            </FormField>
          </ColumnLayout>
        </Container>
      </Form>
    </form>
  )
}
