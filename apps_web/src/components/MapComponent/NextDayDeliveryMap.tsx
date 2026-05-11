/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { useEffect, useState, type FC } from 'react'
import { Map, NavigationControl, Source, Layer } from 'react-map-gl/maplibre'
import type { ViewState } from 'react-map-gl/maplibre'
import * as polyline from '@mapbox/polyline'
import { Container, Header, Icon, SpaceBetween } from '@cloudscape-design/components'
import 'maplibre-gl/dist/maplibre-gl.css'
import MapPin from '../MapPin'
import { appvars } from '../../config'

export type NextDayDeliveryMapInputProps = {
  segments?: any[]
  route?: any
}

const { MAP_VARS } = appvars

const NextDayDeliveryMap: FC<NextDayDeliveryMapInputProps> = ({ segments, route }) => {
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [geoJSON, setGeoJSON] = useState<any[]>([])

  const baseLocation = {
    latitude: MAP_VARS.DEFAULT_LATITUDE,
    longitude: MAP_VARS.DEFAULT_LONGITUDE,
    zoom: 12,
  }

  const [viewState, setViewState] = useState<ViewState>({
    latitude: baseLocation.latitude,
    longitude: baseLocation.longitude,
    zoom: baseLocation.zoom,
    bearing: 0,
    pitch: 0,
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
  })

  const resetDefault = () => {
    setViewState((old) => ({ ...old, ...baseLocation }))
  }

  useEffect(() => {
    if (!segments || segments.length === 0) {
      setWarehouses([])
      setCustomers([])
      return
    }

    setWarehouses([
      {
        latitude: segments[0].from.lat,
        longitude: segments[0].from.long,
      },
    ])

    setCustomers(
      segments.map((r: any) => ({
        deliveryCode: r.deliveryCode,
        deliveryName: r.deliveryName,
        deliveryTimeGroup: r.deliveryTimeGroup,
        demands: r.demands,
        latitude: r.to.lat,
        longitude: r.to.long,
      })),
    )
  }, [segments])

  useEffect(() => {
    if (!route) {
      setGeoJSON([])
      return
    }

    setGeoJSON([
      {
        type: 'Feature',
        geometry: polyline.toGeoJSON(route.pointsEncoded),
      },
    ])
  }, [route])

  return (
    <Container
      header={
        <Header
          variant='h2'
          actions={
            <SpaceBetween size='xs' direction='horizontal'>
              <span>
                {viewState.latitude.toFixed(4)} {viewState.longitude.toFixed(4)} {Math.floor(viewState.zoom)}
              </span>
              <span onClick={resetDefault} style={{ cursor: 'pointer' }} title='Reset view'>
                <Icon name='status-positive' />
              </span>
            </SpaceBetween>
          }
        >
          Map
        </Header>
      }
    >
      <div style={{ width: '100%', height: 800 }}>
        <Map
          {...viewState}
          onMove={(e) => setViewState(e.viewState)}
          mapStyle={MAP_VARS.MAP_STYLE}
          style={{ width: '100%', height: '100%' }}
        >
          <NavigationControl position='top-left' showCompass={false} />
          {warehouses.map((r, idx) => (
            <MapPin
              key={`warehouse-${idx}`}
              latitude={r.latitude}
              longitude={r.longitude}
              data={r}
              iconName='house'
              color='crimson'
            />
          ))}
          {customers.map((r, idx) => (
            <MapPin
              key={`customer-${idx}`}
              latitude={r.latitude}
              longitude={r.longitude}
              data={r}
              iconName='person'
              color='magenta'
            />
          ))}
          {geoJSON.map((g, idx) => (
            <Source key={`route-${idx}`} id={`route-${idx}`} type='geojson' data={g}>
              <Layer
                id={`route-layer-${idx}`}
                type='line'
                paint={{
                  'line-color': '#9314FF',
                  'line-opacity': 0.9,
                  'line-width': [
                    'interpolate',
                    ['exponential', 2],
                    ['zoom'],
                    0,
                    4 * Math.pow(2, 0 - 12),
                    24,
                    4 * Math.pow(2, 24 - 12),
                  ],
                }}
                layout={{ 'line-cap': 'round', 'line-join': 'round' }}
              />
            </Source>
          ))}
        </Map>
      </div>
    </Container>
  )
}

export default NextDayDeliveryMap
