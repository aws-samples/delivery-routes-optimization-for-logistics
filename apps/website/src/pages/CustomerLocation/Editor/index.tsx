/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { FunctionComponent, useCallback, useState } from 'react'
import { CustomerLocationData, EMPTY_CUSTOMER_LOCATION } from '../../../models'
import { Button, ColumnLayout, Form, FormField, FormSection, Inline, Input, Stack } from 'aws-northstar'
import { useHistory, useParams } from 'react-router-dom'
import { v4 as uuid } from 'uuid'
import { useCustomerLocationContext } from '../../../contexts/CustomerLocationContext'
import { appvars } from '../../../config'
import { dayjsutc } from '../../../utils/dayjs'
import { useImmer } from 'use-immer'
import { Draft } from 'immer'

export const Editor: FunctionComponent = () => {
  const history = useHistory()
  const { customerLocationId } = useParams<{ customerLocationId: string }>()
  const [{ items: customerLocationItems, isLoading }, { updateItem, createItem }] = useCustomerLocationContext()

  const editMode = !(customerLocationId === 'new' || customerLocationId === undefined)
  const [customerLocationData, updateCustomerLocationData] = useImmer<CustomerLocationData>(() => {
    if (editMode && customerLocationItems != null) {
      const sel = customerLocationItems.find((x) => x.Id === customerLocationId)

      if (sel != null) {
        return sel
      }
    }

    return {
      ...EMPTY_CUSTOMER_LOCATION,
      Id: uuid(),
    }
  })

  const [formError, setFormError] = useState<string>()

  const onSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      if (customerLocationData == null) {
        throw new Error('CustomerLocationData is null')
      }

      try {
        if (editMode) {
          updateItem(customerLocationData, true)
        } else {
          await createItem(customerLocationData)
        }

        history.push(`/${appvars.URL.CUSTOMER_LOCATION}/${customerLocationData.Id}`)
      } catch (err) {
        setFormError(`Error while ${editMode ? 'updating' : 'saving new'} customer location object: ${err}`)
      }
    },
    [customerLocationData, history, updateItem, createItem, setFormError, editMode],
  )

  if (customerLocationData == null) {
    return null
  }

  return (
    <Form
      header={editMode ? 'Edit customer location' : 'New customer location'}
      onSubmit={onSubmit}
      errorText={formError}
      actions={
        <Inline>
          <Button
            variant='link'
            onClick={() => {
              history.push(
                editMode
                  ? `/${appvars.URL.CUSTOMER_LOCATION}/${customerLocationData.Id}`
                  : `/${appvars.URL.CUSTOMER_LOCATION}`,
              )
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
      <FormSection header='Customer location details'>
        <ColumnLayout>
          <Stack>
            <FormField label='Customer ID' controlId='field_DeliveryCode'>
              <Input
                type='text'
                controlId='text_DeliveryCode'
                value={customerLocationData.deliveryCode}
                required={true}
                placeholder='Customer deliveryCode'
                onChange={(e) => {
                  updateCustomerLocationData((draft: Draft<CustomerLocationData>) => {
                    draft.deliveryCode = e
                  })
                }}
              />
            </FormField>
          </Stack>
          <Stack>
            <FormField label='Latitude' controlId='field_Latitude'>
              <Input
                type='text'
                controlId='text_Latitude'
                value={customerLocationData.latitude}
                required={true}
                placeholder='Customer location latitude'
                onChange={(e) => {
                  updateCustomerLocationData((draft: Draft<CustomerLocationData>) => {
                    draft.latitude = parseFloat(e)
                  })
                }}
              />
            </FormField>
          </Stack>
          <Stack>
            <FormField label='Longitude' controlId='field_Longitude'>
              <Input
                type='text'
                controlId='text_Longitude'
                value={customerLocationData.longitude}
                required={true}
                placeholder='Customer location longitude'
                onChange={(e) => {
                  updateCustomerLocationData((draft: Draft<CustomerLocationData>) => {
                    draft.longitude = parseFloat(e)
                  })
                }}
              />
            </FormField>
          </Stack>
          <Stack>
            <FormField label='Warehouse Code' controlId='field_warehouseCode'>
              <Input
                type='text'
                controlId='text_warehouseCode'
                value={customerLocationData.warehouseCode}
                required={true}
                placeholder='Customer location warehouseCode'
                onChange={(e) => {
                  updateCustomerLocationData((draft: Draft<CustomerLocationData>) => {
                    draft.warehouseCode = e
                  })
                }}
              />
            </FormField>
          </Stack>
        </ColumnLayout>
        <ColumnLayout>
          <Stack>
            <FormField label='Name' controlId='field_DeliveryName'>
              <Input
                type='text'
                controlId='text_DeliveryName'
                value={customerLocationData.deliveryName}
                required={true}
                placeholder='Customer deliveryName'
                onChange={(e) => {
                  updateCustomerLocationData((draft: Draft<CustomerLocationData>) => {
                    draft.deliveryName = e
                  })
                }}
              />
            </FormField>
          </Stack>
          <Stack>
            <FormField label='Address' controlId='field_Address'>
              <Input
                type='text'
                controlId='text_Address'
                value={customerLocationData.address}
                required={true}
                placeholder='Customer Address'
                onChange={(e) => {
                  updateCustomerLocationData((draft: Draft<CustomerLocationData>) => {
                    draft.address = e
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
