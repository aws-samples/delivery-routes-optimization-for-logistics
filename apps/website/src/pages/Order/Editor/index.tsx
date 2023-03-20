/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { FunctionComponent, useCallback, useState } from 'react'
import { OrderData, EMPTY_ORDER_DATA } from '../../../models'
import { Button, Checkbox, ColumnLayout, Form, FormField, FormSection, Inline, Input, Stack } from 'aws-northstar'
import { useHistory, useParams } from 'react-router-dom'
import { v4 as uuid } from 'uuid'
import { appvars } from '../../../config'
import { useOrderContext } from '../../../contexts/OrderQueryContext'
import { dayjsutc } from '../../../utils/dayjs'
import { useImmer } from 'use-immer'
import { Draft } from 'immer'

export const Editor: FunctionComponent = () => {
  const history = useHistory()
  const { orderId } = useParams<{ orderId: string }>()
  const [{ items: orderItems, isLoading }, { updateItem, createItem }] = useOrderContext()

  const editMode = !(orderId === 'new' || orderId === undefined)
  const [orderData, updateOrderData] = useImmer<OrderData>(() => {
    if (editMode && orderItems != null) {
      const sel = orderItems.find((x) => x.Id === orderId)

      if (sel != null) {
        return sel
      }
    }

    return {
      ...EMPTY_ORDER_DATA,
      Id: uuid(),
    }
  })

  const [formError, setFormError] = useState<string>()

  const onSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      if (orderData == null) {
        throw new Error('OrderData is null')
      }

      try {
        if (editMode) {
          updateItem(orderData, true)
        } else {
          await createItem(orderData)
        }

        history.push(`/${appvars.URL.ORDER}/${orderData.Id}`)
      } catch (err) {
        setFormError(`Error while ${editMode ? 'updating' : 'saving new'} order object: ${err}`)
      }
    },
    [orderData, history, updateItem, createItem, setFormError, editMode],
  )

  if (orderData == null) {
    return null
  }

  return (
    <Form
      header={editMode ? 'Edit order' : 'New Order'}
      onSubmit={onSubmit}
      errorText={formError}
      actions={
        <Inline>
          <Button
            variant='link'
            onClick={() => {
              history.push(editMode ? `/${appvars.URL.ORDER}/${orderData.Id}` : `/${appvars.URL.ORDER}`)
            }}
          >
            Cancel
          </Button>
          <Button type='submit' variant='primary'>
            Save
          </Button>
        </Inline>
      }
    >
      <FormSection header='Details'>
        <ColumnLayout>
          <Stack>
            <FormField label='Id' controlId='field_Id'>
              <Input type='text' controlId='text_Id' value={orderData.Id} required={true} disabled={true} />
            </FormField>
          </Stack>
          <Stack>
            <FormField label='Order No' controlId='field_OrderNo'>
              <Input
                type='text'
                controlId='text_OrderNo'
                value={orderData.orderNo}
                required={true}
                placeholder='Order No'
                onChange={(e) => {
                  updateOrderData((draft: Draft<OrderData>) => {
                    draft.orderNo = e
                  })
                }}
              />
            </FormField>
          </Stack>
          <Stack>
            <FormField label='Customer No' controlId='field_RealDeliveryCd'>
              <Input
                type='text'
                controlId='text_RealDeliveryCd'
                value={orderData.deliveryCode}
                required={true}
                placeholder='Real Delivery Code'
                onChange={(e) => {
                  updateOrderData((draft: Draft<OrderData>) => {
                    draft.deliveryCode = e
                  })
                }}
              />
            </FormField>
          </Stack>
          <Stack>
            <FormField label='Customer Name' controlId='field_DeliveryNm'>
              <Input
                type='text'
                controlId='text_DeliveryNm'
                value={orderData.deliveryName}
                required={true}
                placeholder='Delivery Name'
                onChange={(e) => {
                  updateOrderData((draft: Draft<OrderData>) => {
                    draft.deliveryName = e
                  })
                }}
              />
            </FormField>
          </Stack>
        </ColumnLayout>
      </FormSection>
      <FormSection header=''>
        <ColumnLayout>
          <Stack>
            <FormField label='Weight' controlId='field_SumWeight'>
              <Input
                type='number'
                controlId='text_SumWeight'
                value={orderData.sumWeight}
                required={true}
                placeholder='Sum Weight'
                onChange={(e) => {
                  updateOrderData((draft: Draft<OrderData>) => {
                    draft.sumWeight = parseFloat(e)
                  })
                }}
              />
            </FormField>
          </Stack>
        </ColumnLayout>
      </FormSection>
    </Form>
  )
}
