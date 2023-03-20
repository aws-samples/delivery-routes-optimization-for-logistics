/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

/* eslint-disable @typescript-eslint/no-var-requires */
import React, { useEffect, useState } from 'react'
import ReactMapGL, { NavigationControl, Source, Layer } from 'react-map-gl'
import * as polyline from '@mapbox/polyline'
import Container from 'aws-northstar/layouts/Container'
import Inline from 'aws-northstar/layouts/Inline'
import Icon from 'aws-northstar/components/Icon'
// to fix: https://github.com/visgl/react-map-gl/issues/1266
import mapboxgl from 'mapbox-gl'
import MapPin from '../MapPin'
import { appvars } from '../../config'

// @ts-ignore
// eslint-disable-next-line import/no-webpack-loader-syntax
mapboxgl.workerClass = require('worker-loader!mapbox-gl/dist/mapbox-gl-csp-worker').default

const navControlStyle = {
  left: 10,
  top: 10,
}

export type NextDayDeliveryMapInputProps = {
  segments?: any[]
  route?: any[]
}

const getColor = (idx: number) => {
  if (idx % 2) {
    return '#03AA46'
  }

  return '#AA0303'
}
const MAX_DRIVERS = 100

const { MAPBOX_VARS } = appvars

const NextDayDeliveryMapComponent: React.FC<NextDayDeliveryMapInputProps> = ({ segments, route }) => {
  const [warehouses, setWarehouses] = useState<any>([])
  const [customers, setCustomers] = useState<any>([])
  const [geoJSON, setGeoJSON] = useState<any>([])
  const [segmentsState, setSegmentsState] = useState<any>([])
  const [routeState, setRouteState] = useState<any>()

  const baseLocation = {
    latitude: MAPBOX_VARS.DEFAULT_LATITUDE,
    longitude: MAPBOX_VARS.DEFAULT_LONGITUDE,
    zoom: 12,
  }

  const [viewport, setViewport] = useState({
    width: '100%',
    height: 800,
    ...baseLocation,
  })

  const resetDefault = () => {
    setViewport((old) => ({
      ...old,
      ...baseLocation,
    }))
  }

  useEffect(() => {
    setSegmentsState(segments)
    setRouteState(route)
  }, [segments, route])

  // Warehouse
  useEffect(() => {
    if (!segmentsState || segmentsState.length === 0) {
      return
    }

    setWarehouses([
      {
        latitude: segmentsState[0].from.lat,
        longitude: segmentsState[0].from.long,
      },
    ])
  }, [segmentsState])

  // Customers
  useEffect(() => {
    if (!segmentsState || segmentsState.length === 0) {
      return
    }

    const customerLocations = segmentsState.map((r: any) => {
      return {
        deliveryCode: r.deliveryCode,
        deliveryName: r.deliveryName,
        deliveryTimeGroup: r.deliveryTimeGroup,
        demands: r.demands,
        latitude: r.to.lat,
        longitude: r.to.long,
      }
    })

    setCustomers(customerLocations)
  }, [segmentsState])

  // Routes
  useEffect(() => {
    if (!routeState) {
      return
    }

    const routeGeoJson = {
      type: 'Feature',
      geometry: polyline.toGeoJSON(routeState.pointsEncoded),
    }

    setGeoJSON([routeGeoJson])
  }, [routeState])

  return (
    <Container
      headingVariant='h2'
      title='Map'
      style={{ marginTop: '25px' }}
      actionGroup={
        <Inline>
          {viewport.latitude} {viewport.longitude} {parseInt(viewport.zoom.toString(), 10)}
          <span onClick={resetDefault} style={{ cursor: 'pointer' }}>
            <Icon name='GpsFixed' />
          </span>
        </Inline>
      }
    >
      <ReactMapGL
        width={viewport.width}
        height={viewport.height}
        latitude={viewport.latitude}
        longitude={viewport.longitude}
        zoom={viewport.zoom}
        mapStyle='mapbox://styles/mapbox/streets-v11'
        mapboxApiAccessToken={MAPBOX_VARS.MAPBOX_TOKEN}
        onViewportChange={(v: any) => setViewport(v)}
      >
        <NavigationControl style={navControlStyle} showCompass={false} />
        {warehouses &&
          warehouses.map((r: any, idx: number) => (
            <MapPin
              key={'warehouse' + idx}
              latitude={r.latitude}
              longitude={r.longitude}
              data={r}
              iconName='House'
              color='crimson'
            />
          ))}
        {customers &&
          customers.map((r: any, idx: number) => (
            <MapPin
              key={'customer' + idx}
              latitude={r.latitude}
              longitude={r.longitude}
              data={r}
              iconName='PersonPinCircle'
              color='magenta'
            />
          ))}
        {geoJSON &&
          geoJSON.map((g: any, idx: number) => (
            <Source key={idx} id={`route-${idx}`} type='geojson' data={g}>
              <Layer
                type='line'
                paint={{
                  'line-color': '#9314FF',
                  'line-opacity': 0.9,
                  'line-width': {
                    type: 'exponential',
                    base: 2,
                    stops: [
                      [0, 4 * Math.pow(2, 0 - 12)],
                      [24, 4 * Math.pow(2, 24 - 12)],
                    ],
                  },
                }}
                layout={{ 'line-cap': 'round', 'line-join': 'round' }}
              />
            </Source>
          ))}
      </ReactMapGL>
    </Container>
  )
}

export default NextDayDeliveryMapComponent
