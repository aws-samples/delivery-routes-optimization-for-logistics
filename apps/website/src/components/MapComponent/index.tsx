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
import Alert from 'aws-northstar/components/Alert'
// to fix: https://github.com/visgl/react-map-gl/issues/1266
import mapboxgl from 'mapbox-gl'
import MapPin from '../MapPin'
import utils from '../../utils'
import { appvars } from '../../config'

// @ts-ignore
// eslint-disable-next-line import/no-webpack-loader-syntax
mapboxgl.workerClass = require('worker-loader!mapbox-gl/dist/mapbox-gl-csp-worker').default

const navControlStyle = {
  left: 10,
  top: 10,
}

export type MapInputProps = {
  orders?: any[]
  geofences?: any[]
  warehouses?: any[]
  customers?: any[]
}

const getColor = (idx: number) => {
  if (idx % 2) {
    return '#03AA46'
  }

  return '#AA0303'
}
const MAX_DRIVERS = 100

const { MAPBOX_VARS } = appvars

const MapComponent: React.FC<MapInputProps> = ({ orders, geofences, warehouses, customers }) => {
  const [geoJSON, setGeoJSON] = useState<any>([])
  const [drivers, setDrivers] = useState<any>([])
  const [polygons, setPolygons] = useState<any>([])

  const baseLocation = {
    latitude: MAPBOX_VARS.DEFAULT_LATITUDE,
    longitude: MAPBOX_VARS.DEFAULT_LONGITUDE,
    zoom: 12,
  }

  if (warehouses && warehouses.length > 0) {
    baseLocation.latitude = warehouses[0].latitude
    baseLocation.longitude = warehouses[0].longitude
  } else if (customers && customers.length > 0) {
    baseLocation.latitude = customers[0].latitude
    baseLocation.longitude = customers[0].longitude
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
    if (orders) {
      // TODO: change once routing available q.detail.route
      const paths = orders.map((q: any) => q.detail.route && polyline.toGeoJSON(q.detail.route.pointsEncoded)).flat()

      if (paths.length) {
        setGeoJSON(
          paths.map((p: any) => ({
            type: 'Feature',
            geometry: p,
          })),
        )
      }
    }
  }, [orders])

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
      {drivers.length === MAX_DRIVERS && <Alert>The Map only shows {MAX_DRIVERS} drivers</Alert>}
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
            <MapPin key={idx} latitude={r.latitude} longitude={r.longitude} data={r} iconName='House' color='crimson' />
          ))}
        {customers &&
          customers.map((r: any, idx: number) => (
            <MapPin
              key={idx}
              latitude={r.latitude}
              longitude={r.longitude}
              data={r}
              iconName='PersonPinCircle'
              color='magenta'
            />
          ))}
        {drivers &&
          drivers.map((d: any, idx: number) => (
            <MapPin key={idx} latitude={d.latitude} longitude={d.longitude} data={d} />
          ))}
        {orders &&
          orders
            .flatMap((q: any) => q.detail.segments)
            .filter((s) => s.segmentType === 'TO_DESTINATION')
            .map((r: any, idx: number) => (
              <MapPin key={idx} latitude={r.to.lat} longitude={r.to.long} data={r} iconName='Face' />
            ))}
        {orders &&
          orders
            .flatMap((q: any) => q.detail.segments)
            .filter((s) => s.segmentType === 'TO_ORIGIN')
            .map((r: any, idx: number) => (
              <MapPin key={idx} latitude={r.to.lat} longitude={r.to.long} data={r} iconName='Restaurant' />
            ))}
        {geoJSON &&
          geoJSON.map((g: any, idx: number) => (
            <Source key={idx} id={`route-${idx}`} type='geojson' data={g}>
              <Layer
                type='line'
                paint={{
                  'line-color': getColor(idx),
                  'line-opacity': 0.8,
                  'line-width': {
                    type: 'exponential',
                    base: 2,
                    stops: [
                      [0, 4 * Math.pow(2, 0 - 14)],
                      [24, 4 * Math.pow(2, 24 - 14)],
                    ],
                  },
                }}
                layout={{ 'line-cap': 'round', 'line-join': 'round' }}
              />
            </Source>
          ))}
        {geofences &&
          geofences.map((g: any, idx: number) => (
            <Source
              key={idx}
              id={`geofence-${idx}`}
              type='geojson'
              data={utils.generateGeofenceGEOJSON(g.detail.lat, g.detail.long)}
            >
              <Layer
                type='circle'
                paint={{
                  'circle-color': 'blue',
                  'circle-opacity': 0.4,
                  'circle-radius': {
                    stops: [
                      [0, 0],
                      [20, utils.metersToPixelsAtMaxZoom(g.detail.radius, g.detail.lat)],
                    ],
                    base: 2,
                  },
                }}
              />
            </Source>
          ))}
        {polygons &&
          polygons.map((p: any, idx: number) => (
            <Source key={idx} id={`polygon-${idx}`} type='geojson' data={utils.generatePolygonGEOJSON(p.vertices)}>
              <Layer
                type='fill'
                paint={{
                  'fill-color': '#0091cd',
                  'fill-opacity': 0.1,
                }}
              />
            </Source>
          ))}
      </ReactMapGL>
    </Container>
  )
}

export default MapComponent
