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
import { useParams } from 'react-router-dom'
import NotFound from '../../../components/NotFound'
import { useDistanceCacheContext } from '../../../contexts/DistanceCacheContext'
import { appvars } from '../../../config'

export const Details: FunctionComponent = () => {
  const { distCacheId } = useParams<{ distCacheId: string }>()
  const [{ items: distCacheItems }] = useDistanceCacheContext()
  const currentItem = distCacheItems.find((x) => x.Id === distCacheId)

  if (currentItem == null) {
    return <NotFound what={'DistanceCache data'} backUrl={appvars.URL.DISTANCE_CACHE} />
  }

  return (
    <>
      <Container headingVariant='h1' title={`DistanceCache (${currentItem.warehouseCode})`}>
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
                  <KeyValuePair label='Department(Warehouse)' value={currentItem.warehouseCode} />
                </Stack>
              </Column>
              <Column key='col3'>
                <Stack>
                  <KeyValuePair label='Locations' value={currentItem.numOfLocations} />
                </Stack>
              </Column>
            </ColumnLayout>
          </Container>
          <Container headingVariant='h3' title='Build Info'>
            <ColumnLayout>
              <Column key='col4'>
                <Stack>
                  <KeyValuePair label='Status' value={currentItem.status} />
                </Stack>
              </Column>
              <Column key='col5'>
                <Stack>
                  <KeyValuePair label='Status Detail' value={currentItem.reason} />
                </Stack>
              </Column>
              <Column key='col6'>
                <Stack>
                  <KeyValuePair label='Created' value={currentItem.buildTime} />
                </Stack>
              </Column>
            </ColumnLayout>
          </Container>
        </Stack>
      </Container>
    </>
  )
}
