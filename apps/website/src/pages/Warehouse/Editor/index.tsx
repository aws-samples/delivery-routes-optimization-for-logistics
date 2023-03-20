/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { FunctionComponent, useCallback, useState } from 'react'
import { WarehouseData, EMPTY_WAREHOUSE } from '../../../models'
import { Button, ColumnLayout, Form, FormField, FormSection, Inline, Input, Stack } from 'aws-northstar'
import { useHistory, useParams } from 'react-router-dom'
import { v4 as uuid } from 'uuid'
import { useWarehouseContext } from '../../../contexts/WarehouseContext'
import { appvars } from '../../../config'
import { dayjsutc } from '../../../utils/dayjs'
import { useImmer } from 'use-immer'
import { Draft } from 'immer'

export const Editor: FunctionComponent = () => {
  const history = useHistory()
  const { warehouseId } = useParams<{ warehouseId: string }>()
  const [{ items: warehouseItems, isLoading }, { updateItem, createItem }] = useWarehouseContext()

  const editMode = !(warehouseId === 'new' || warehouseId === undefined)
  const [warehouseData, updateWarehouseData] = useImmer<WarehouseData>(() => {
    if (editMode && warehouseItems != null) {
      const sel = warehouseItems.find((x) => x.Id === warehouseId)

      if (sel != null) {
        return sel
      }
    }

    return {
      ...EMPTY_WAREHOUSE,
      Id: uuid(),
    }
  })

  const [formError, setFormError] = useState<string>()

  const onSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      if (warehouseData == null) {
        throw new Error('WarehouseData is null')
      }

      try {
        if (editMode) {
          updateItem(warehouseData, true)
        } else {
          await createItem(warehouseData)
        }

        history.push(`/${appvars.URL.WAREHOUSE}/${warehouseData.Id}`)
      } catch (err) {
        setFormError(`Error while ${editMode ? 'updating' : 'saving new'} warehouse object: ${err}`)
      }
    },
    [warehouseData, history, updateItem, createItem, setFormError, editMode],
  )

  if (warehouseData == null) {
    return null
  }

  return (
    <Form
      header={editMode ? 'Edit warehouse' : 'New warehouse'}
      onSubmit={onSubmit}
      errorText={formError}
      actions={
        <Inline>
          <Button
            variant='link'
            onClick={() => {
              history.push(editMode ? `/${appvars.URL.WAREHOUSE}/${warehouseData.Id}` : `/${appvars.URL.WAREHOUSE}`)
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
      <FormSection header='Warehouse Details'>
        <ColumnLayout>
          <Stack>
            <FormField label='Id' controlId='field_Id'>
              <Input type='text' controlId='text_Id' value={warehouseData.Id} required={true} disabled={true} />
            </FormField>
          </Stack>
          <Stack>
            <FormField label='Created' controlId='field_Created'>
              <Input
                type='text'
                controlId='text_Created'
                value={dayjsutc(warehouseData.createdAt).format(appvars.DATETIMEFORMAT)}
                required={true}
                disabled={true}
              />
            </FormField>
          </Stack>
          <Stack>
            <FormField label='Warehouse Code' controlId='field_warehouseCode'>
              <Input
                type='text'
                controlId='text_warehouseCode'
                value={warehouseData.warehouseCode}
                required={true}
                placeholder='Warehouse code'
                onChange={(e) => {
                  updateWarehouseData((draft: Draft<WarehouseData>) => {
                    draft.warehouseCode = e
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
                value={warehouseData.latitude}
                required={true}
                placeholder='Warehouse latitude'
                onChange={(e) => {
                  updateWarehouseData((draft: Draft<WarehouseData>) => {
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
                value={warehouseData.longitude}
                required={true}
                placeholder='Warehouse longitude'
                onChange={(e) => {
                  updateWarehouseData((draft: Draft<WarehouseData>) => {
                    draft.longitude = parseFloat(e)
                  })
                }}
              />
            </FormField>
          </Stack>
        </ColumnLayout>
        <ColumnLayout>
          <Stack>
            <FormField label='Warehouse Name' controlId='field_warehouseName'>
              <Input
                type='text'
                controlId='text_warehouseName'
                value={warehouseData.warehouseName}
                required={true}
                placeholder='Warehouse warehouseName'
                onChange={(e) => {
                  updateWarehouseData((draft: Draft<WarehouseData>) => {
                    draft.warehouseName = e
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
                value={warehouseData.address}
                required={true}
                placeholder='Warehouse Address'
                onChange={(e) => {
                  updateWarehouseData((draft: Draft<WarehouseData>) => {
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
