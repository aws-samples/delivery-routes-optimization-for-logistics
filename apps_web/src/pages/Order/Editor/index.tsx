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
import { EMPTY_ORDER_DATA, type OrderData } from '../../../models'
import { useOrderContext } from '../../../contexts/OrderQueryContext'
import { appvars } from '../../../config'

export const Editor: FunctionComponent = () => {
  const navigate = useNavigate()
  const { orderId } = useParams<{ orderId: string }>()
  const [{ items }, { updateItem, createItem }] = useOrderContext()

  const editMode = !(orderId === undefined)
  const [data, update] = useImmer<OrderData>(() => {
    if (editMode && items != null) {
      const sel = items.find((x) => x.Id === orderId)
      if (sel != null) {
        return sel
      }
    }
    return { ...EMPTY_ORDER_DATA, Id: uuid() }
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
        navigate(`/${appvars.URL.ORDER}/${data.Id}`)
      } catch (err) {
        setFormError(`Error while ${editMode ? 'updating' : 'saving new'} order object: ${err}`)
      }
    },
    [data, navigate, updateItem, createItem, editMode],
  )

  const onCancel = () => {
    navigate(editMode ? `/${appvars.URL.ORDER}/${data.Id}` : `/${appvars.URL.ORDER}`)
  }

  const setField = <K extends keyof OrderData>(key: K, value: OrderData[K]) => {
    update((draft: Draft<OrderData>) => {
      draft[key] = value
    })
  }

  return (
    <form onSubmit={onSubmit}>
      <Form
        header={<Header variant='h1'>{editMode ? 'Edit order' : 'New Order'}</Header>}
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
        <SpaceBetween size='l'>
          <Container header={<Header variant='h2'>Details</Header>}>
            <ColumnLayout columns={2}>
              <FormField label='Id' controlId='field_Id'>
                <Input value={data.Id} disabled />
              </FormField>
              <FormField label='Order No' controlId='field_OrderNo'>
                <Input value={data.orderNo} onChange={({ detail }) => setField('orderNo', detail.value)} />
              </FormField>
              <FormField label='Customer No' controlId='field_RealDeliveryCd'>
                <Input value={data.deliveryCode} onChange={({ detail }) => setField('deliveryCode', detail.value)} />
              </FormField>
              <FormField label='Customer Name' controlId='field_DeliveryNm'>
                <Input value={data.deliveryName} onChange={({ detail }) => setField('deliveryName', detail.value)} />
              </FormField>
              <FormField label='Weight' controlId='field_SumWeight'>
                <Input
                  type='number'
                  value={String(data.sumWeight)}
                  onChange={({ detail }) => setField('sumWeight', parseFloat(detail.value))}
                />
              </FormField>
            </ColumnLayout>
          </Container>
        </SpaceBetween>
      </Form>
    </form>
  )
}
