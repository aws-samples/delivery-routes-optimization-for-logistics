/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import type { FunctionComponent } from 'react'
import { useParams } from 'react-router-dom'
import { Container, Header, KeyValuePairs, SpaceBetween } from '@cloudscape-design/components'
import { useDistanceCacheContext } from '../../../contexts/DistanceCacheContext'
import { appvars } from '../../../config'
import NotFound from '../../../components/NotFound'

export const Details: FunctionComponent = () => {
  const { distCacheId } = useParams<{ distCacheId: string }>()
  const [{ items }] = useDistanceCacheContext()
  const currentItem = items.find((x) => x.Id === distCacheId)

  if (currentItem == null) {
    return <NotFound what='DistanceCache data' backUrl={appvars.URL.DISTANCE_CACHE} />
  }

  return (
    <SpaceBetween size='l'>
      <Header variant='h1'>DistanceCache ({currentItem.warehouseCode})</Header>

      <Container header={<Header variant='h2'>Details</Header>}>
        <KeyValuePairs
          columns={3}
          items={[
            { label: 'Id', value: currentItem.Id },
            { label: 'Department (Warehouse)', value: currentItem.warehouseCode },
            { label: 'Locations', value: currentItem.numOfLocations },
          ]}
        />
      </Container>

      <Container header={<Header variant='h2'>Build Info</Header>}>
        <KeyValuePairs
          columns={3}
          items={[
            { label: 'Status', value: currentItem.status },
            { label: 'Status Detail', value: currentItem.reason },
            { label: 'Created', value: currentItem.buildTime },
          ]}
        />
      </Container>
    </SpaceBetween>
  )
}
