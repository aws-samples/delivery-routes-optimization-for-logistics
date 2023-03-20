/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import React, { useState } from 'react'
import ReactMapGL, { NavigationControl, Layer, Source } from 'react-map-gl'
import { FeatureCollection, Position } from 'geojson'
import utils from '../../utils'

declare let appVariables: {
  MAP_BOX_TOKEN: string
}
const navControlStyle = {
  left: 10,
  top: 10,
}

export type PolyonMapInputProps = {
  vertices: [{ lat: number; long: number }]
}

const PolygonMap: React.FC<PolyonMapInputProps> = ({ vertices }) => {
  const [viewport, setViewport] = useState({
    width: 600,
    height: 600,
    zoom: 11,
    latitude: vertices[0].lat,
    longitude: vertices[0].long,
  })

  const geojson: FeatureCollection = {
    type: 'FeatureCollection',
    features: [utils.generatePolygonGEOJSON(vertices)],
  }

  return (
    <ReactMapGL
      width={viewport.width}
      height={viewport.height}
      zoom={viewport.zoom}
      latitude={viewport.latitude}
      longitude={viewport.longitude}
      mapStyle='mapbox://styles/mapbox/streets-v11'
      mapboxApiAccessToken={appVariables.MAP_BOX_TOKEN}
      onViewportChange={(v: any) => setViewport(v)}
    >
      <NavigationControl style={navControlStyle} showCompass={false} />
      <Source id='polygon-data' type='geojson' data={geojson} />
      <Layer
        id='polygonlayer'
        type='fill'
        source='polygon-data'
        paint={{
          'fill-color': '#0091cd',
          'fill-opacity': 0.4,
        }}
      />
    </ReactMapGL>
  )
}

export default PolygonMap
