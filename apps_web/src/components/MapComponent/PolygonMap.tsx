/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { useState, type FC } from 'react'
import { Map, NavigationControl, Layer, Source } from 'react-map-gl/maplibre'
import type { ViewState } from 'react-map-gl/maplibre'
import type { FeatureCollection } from 'geojson'
import 'maplibre-gl/dist/maplibre-gl.css'
import utils from '../../utils'
import { appvars } from '../../config'

export interface PolygonMapInputProps {
  vertices: { lat: number; long: number }[]
}

const { MAP_VARS } = appvars

const PolygonMap: FC<PolygonMapInputProps> = ({ vertices }) => {
  const [viewState, setViewState] = useState<ViewState>({
    latitude: vertices[0]?.lat ?? MAP_VARS.DEFAULT_LATITUDE,
    longitude: vertices[0]?.long ?? MAP_VARS.DEFAULT_LONGITUDE,
    zoom: 11,
    bearing: 0,
    pitch: 0,
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
  })

  const geojson: FeatureCollection = {
    type: 'FeatureCollection',
    features: [utils.generatePolygonGEOJSON(vertices)],
  }

  return (
    <div style={{ width: 600, height: 600 }}>
      <Map
        {...viewState}
        onMove={(e) => setViewState(e.viewState)}
        mapStyle={MAP_VARS.MAP_STYLE}
        style={{ width: '100%', height: '100%' }}
      >
        <NavigationControl position='top-left' showCompass={false} />
        <Source id='polygon-data' type='geojson' data={geojson}>
          <Layer
            id='polygonlayer'
            type='fill'
            paint={{
              'fill-color': '#0091cd',
              'fill-opacity': 0.4,
            }}
          />
        </Source>
      </Map>
    </div>
  )
}

export default PolygonMap
