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
import { EMPTY_VEHICLE_DATA, type VehicleData } from '../../../models'
import { useVehicleContext } from '../../../contexts/VehicleContext'
import { appvars } from '../../../config'

export const Editor: FunctionComponent = () => {
  const navigate = useNavigate()
  const { vehicleId } = useParams<{ vehicleId: string }>()
  const [{ items: vehicleItems }, { updateItem, createItem }] = useVehicleContext()

  const editMode = !(vehicleId === undefined)
  const [vehicleData, updateVehicleData] = useImmer<VehicleData>(() => {
    if (editMode && vehicleItems != null) {
      const sel = vehicleItems.find((x) => x.Id === vehicleId)
      if (sel != null) {
        return sel
      }
    }
    return { ...EMPTY_VEHICLE_DATA, Id: uuid() }
  })
  const [formError, setFormError] = useState<string>()

  const onSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      try {
        if (editMode) {
          updateItem(vehicleData, true)
        } else {
          await createItem(vehicleData)
        }
        navigate(`/${appvars.URL.VEHICLE}/${vehicleData.Id}`)
      } catch (err) {
        setFormError(`Error while ${editMode ? 'updating' : 'saving new'} vehicle object: ${err}`)
      }
    },
    [vehicleData, navigate, updateItem, createItem, editMode],
  )

  const onCancel = () => {
    navigate(editMode ? `/${appvars.URL.VEHICLE}/${vehicleData.Id}` : `/${appvars.URL.VEHICLE}`)
  }

  const setField = <K extends keyof VehicleData>(key: K, value: VehicleData[K]) => {
    updateVehicleData((draft: Draft<VehicleData>) => {
      draft[key] = value
    })
  }

  return (
    <form onSubmit={onSubmit}>
      <Form
        header={<Header variant='h1'>{editMode ? 'Edit vehicle' : 'New vehicle'}</Header>}
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
        <Container header={<Header variant='h2'>Vehicle details</Header>}>
          <ColumnLayout columns={2}>
            <FormField label='Id' controlId='field_Id'>
              <Input value={vehicleData.Id} disabled />
            </FormField>
            <FormField label='Car No.' controlId='field_CarNo'>
              <Input
                value={vehicleData.carNo}
                onChange={({ detail }) => setField('carNo', detail.value)}
                placeholder='Car No'
              />
            </FormField>
            <FormField label='Department (Warehouse)' controlId='field_warehouseCode'>
              <Input
                value={vehicleData.warehouseCode}
                onChange={({ detail }) => setField('warehouseCode', detail.value)}
                placeholder='Warehouse code'
              />
            </FormField>
            <FormField label='Grade' controlId='field_CarGrade'>
              <Input
                value={vehicleData.carGrade}
                onChange={({ detail }) => setField('carGrade', detail.value)}
                placeholder='Car grade'
              />
            </FormField>
            <FormField label='Max Capacity' controlId='field_maxWeight'>
              <Input
                type='number'
                value={String(vehicleData.maxWeight)}
                onChange={({ detail }) => setField('maxWeight', parseFloat(detail.value))}
                placeholder='Max weight'
              />
            </FormField>
          </ColumnLayout>
        </Container>
      </Form>
    </form>
  )
}
