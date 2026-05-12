/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { useEffect, useState, type FC } from 'react'
import { Map, NavigationControl, Source, Layer } from 'react-map-gl/maplibre'
import type { ViewState } from 'react-map-gl/maplibre'
import * as polyline from '@mapbox/polyline'
import { Alert, Container, Header, Icon, SpaceBetween } from '@cloudscape-design/components'
import 'maplibre-gl/dist/maplibre-gl.css'
import MapPin from '../MapPin'
import utils from '../../utils'
import { appvars } from '../../config'

export type MapInputProps = {
  orders?: any[]
  geofences?: any[]
  warehouses?: any[]
  customers?: any[]
}

const getColor = (idx: number) => (idx % 2 ? '#03AA46' : '#AA0303')

const MAX_DRIVERS = 100
const { MAP_VARS } = appvars

const MapComponent: FC<MapInputProps> = ({ orders, geofences, warehouses, customers }) => {
  const [geoJSON, setGeoJSON] = useState<any[]>([])
  const [drivers] = useState<any[]>([])
  const [polygons] = useState<any[]>([])

  const baseLocation = {
    latitude: warehouses?.[0]?.latitude ?? customers?.[0]?.latitude ?? MAP_VARS.DEFAULT_LATITUDE,
    longitude: warehouses?.[0]?.longitude ?? customers?.[0]?.longitude ?? MAP_VARS.DEFAULT_LONGITUDE,
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
    setViewState((old) => ({
      ...old,
      latitude: baseLocation.latitude,
      longitude: baseLocation.longitude,
      zoom: baseLocation.zoom,
    }))
  }

  useEffect(() => {
    if (!orders) return
    const paths = orders
      .map((q: any) => q.detail?.route && polyline.toGeoJSON(q.detail.route.pointsEncoded))
      .filter(Boolean)
      .flat()

    if (paths.length) {
      setGeoJSON(
        paths.map((p: any) => ({
          type: 'Feature',
          geometry: p,
        })),
      )
    }
  }, [orders])

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
      {drivers.length === MAX_DRIVERS && <Alert type='info'>The Map only shows {MAX_DRIVERS} drivers</Alert>}
      <div style={{ width: '100%', height: 800 }}>
        <Map
          {...viewState}
          onMove={(e) => setViewState(e.viewState)}
          mapStyle={MAP_VARS.MAP_STYLE}
          style={{ width: '100%', height: '100%' }}
        >
          <NavigationControl position='top-left' showCompass={false} />
          {warehouses?.map((r: any, idx: number) => (
            <MapPin
              key={`warehouse-${idx}`}
              latitude={r.latitude}
              longitude={r.longitude}
              data={r}
              iconName='house'
              color='crimson'
            />
          ))}
          {customers?.map((r: any, idx: number) => (
            <MapPin
              key={`customer-${idx}`}
              latitude={r.latitude}
              longitude={r.longitude}
              data={r}
              iconName='person'
              color='magenta'
            />
          ))}
          {drivers.map((d: any, idx: number) => (
            <MapPin key={`driver-${idx}`} latitude={d.latitude} longitude={d.longitude} data={d} />
          ))}
          {orders &&
            orders
              .flatMap((q: any) => q.detail?.segments ?? [])
              .filter((s: any) => s.segmentType === 'TO_DESTINATION')
              .map((r: any, idx: number) => (
                <MapPin
                  key={`dest-${idx}`}
                  latitude={r.to.lat}
                  longitude={r.to.long}
                  data={r}
                  iconName='face'
                />
              ))}
          {orders &&
            orders
              .flatMap((q: any) => q.detail?.segments ?? [])
              .filter((s: any) => s.segmentType === 'TO_ORIGIN')
              .map((r: any, idx: number) => (
                <MapPin
                  key={`origin-${idx}`}
                  latitude={r.to.lat}
                  longitude={r.to.long}
                  data={r}
                  iconName='restaurant'
                />
              ))}
          {geoJSON.map((g: any, idx: number) => (
            <Source key={`route-${idx}`} id={`route-${idx}`} type='geojson' data={g}>
              <Layer
                id={`route-layer-${idx}`}
                type='line'
                paint={{
                  'line-color': getColor(idx),
                  'line-opacity': 0.8,
                  'line-width': [
                    'interpolate',
                    ['exponential', 2],
                    ['zoom'],
                    0,
                    4 * Math.pow(2, 0 - 14),
                    24,
                    4 * Math.pow(2, 24 - 14),
                  ],
                }}
                layout={{ 'line-cap': 'round', 'line-join': 'round' }}
              />
            </Source>
          ))}
          {geofences?.map((g: any, idx: number) => (
            <Source
              key={`geofence-${idx}`}
              id={`geofence-${idx}`}
              type='geojson'
              data={utils.generateGeofenceGEOJSON(g.detail.lat, g.detail.long)}
            >
              <Layer
                id={`geofence-layer-${idx}`}
                type='circle'
                paint={{
                  'circle-color': 'blue',
                  'circle-opacity': 0.4,
                  'circle-radius': [
                    'interpolate',
                    ['exponential', 2],
                    ['zoom'],
                    0,
                    0,
                    20,
                    utils.metersToPixelsAtMaxZoom(g.detail.radius, g.detail.lat),
                  ],
                }}
              />
            </Source>
          ))}
          {polygons.map((p: any, idx: number) => (
            <Source
              key={`polygon-${idx}`}
              id={`polygon-${idx}`}
              type='geojson'
              data={utils.generatePolygonGEOJSON(p.vertices)}
            >
              <Layer
                id={`polygon-layer-${idx}`}
                type='fill'
                paint={{
                  'fill-color': '#0091cd',
                  'fill-opacity': 0.1,
                }}
              />
            </Source>
          ))}
        </Map>
      </div>
    </Container>
  )
}

export default MapComponent
