/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { FunctionComponent, useCallback, useState } from 'react'
import { VehicleData, EMPTY_VEHICLE_DATA } from '../../../models'
import { Button, Checkbox, ColumnLayout, Form, FormField, FormSection, Inline, Input, Stack } from 'aws-northstar'
import { useHistory, useParams } from 'react-router-dom'
import { v4 as uuid } from 'uuid'
import { useVehicleContext } from '../../../contexts/VehicleContext'
import { appvars } from '../../../config'
import { dayjsutc } from '../../../utils/dayjs'
import { useImmer } from 'use-immer'
import { Draft } from 'immer'

export const Editor: FunctionComponent = () => {
  const history = useHistory()
  const { vehicleId } = useParams<{ vehicleId: string }>()
  const [{ items: vehicleItems, isLoading }, { updateItem, createItem }] = useVehicleContext()

  const editMode = !(vehicleId === 'new' || vehicleId === undefined)
  const [vehicleData, updateVehicleData] = useImmer<VehicleData>(() => {
    if (editMode && vehicleItems != null) {
      const sel = vehicleItems.find((x) => x.Id === vehicleId)

      if (sel != null) {
        return sel
      }
    }

    return {
      ...EMPTY_VEHICLE_DATA,
      Id: uuid(),
    }
  })

  const [formError, setFormError] = useState<string>()

  const onSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      if (vehicleData == null) {
        throw new Error('VehicleData is null')
      }

      try {
        if (editMode) {
          updateItem(vehicleData, true)
        } else {
          await createItem(vehicleData)
        }

        history.push(`/${appvars.URL.VEHICLE}/${vehicleData.Id}`)
      } catch (err) {
        setFormError(`Error while ${editMode ? 'updating' : 'saving new'} vehicle object: ${err}`)
      }
    },
    [vehicleData, history, updateItem, createItem, setFormError, editMode],
  )

  if (vehicleData == null) {
    return null
  }

  return (
    <Form
      header={editMode ? 'Edit vehicle' : 'New vehicle'}
      onSubmit={onSubmit}
      errorText={formError}
      actions={
        <Inline>
          <Button
            variant='link'
            onClick={() => {
              history.push(editMode ? `/${appvars.URL.VEHICLE}/${vehicleData.Id}` : `/${appvars.URL.VEHICLE}`)
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
      <FormSection header='Vehicle details'>
        <ColumnLayout>
          <Stack>
            <FormField label='Id' controlId='field_Id'>
              <Input type='text' controlId='text_Id' value={vehicleData.Id} required={true} disabled={true} />
            </FormField>
          </Stack>
          <Stack>
            <FormField label='Car No.' controlId='field_CarNo'>
              <Input
                type='text'
                controlId='text_CarNo'
                value={vehicleData.carNo}
                required={true}
                placeholder='Car No'
                onChange={(e) => {
                  updateVehicleData((draft: Draft<VehicleData>) => {
                    draft.carNo = e
                  })
                }}
              />
            </FormField>
          </Stack>
          <Stack>
            <FormField label='Department(Warehouse)' controlId='field_warehouseCode'>
              <Input
                type='text'
                controlId='text_warehouseCode'
                value={vehicleData.warehouseCode}
                required={true}
                placeholder='warehouseCode'
                onChange={(e) => {
                  updateVehicleData((draft: Draft<VehicleData>) => {
                    draft.warehouseCode = e
                  })
                }}
              />
            </FormField>
          </Stack>
          <Stack>
            <FormField label='Grade' controlId='field_CarGrade'>
              <Input
                type='text'
                controlId='text_CarGrade'
                value={vehicleData.carGrade}
                required={true}
                placeholder='Car Grade'
                onChange={(e) => {
                  updateVehicleData((draft: Draft<VehicleData>) => {
                    draft.carGrade = e
                  })
                }}
              />
            </FormField>
          </Stack>
          <Stack>
            <FormField label='Max Capacity' controlId='field_maxWeight'>
              <Input
                type='number'
                controlId='text_maxWeight'
                value={vehicleData.maxWeight}
                required={true}
                placeholder='Max Weight'
                onChange={(e) => {
                  updateVehicleData((draft: Draft<VehicleData>) => {
                    draft.maxWeight = parseFloat(e)
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
