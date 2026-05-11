/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import type { FC } from 'react'
import { Marker } from 'react-map-gl/maplibre'
import { Popover } from '@cloudscape-design/components'
import ReactMarkdown from 'react-markdown'

export type MapPinIcon = 'house' | 'person' | 'face' | 'restaurant'

export interface IMapPin {
  longitude: number
  latitude: number
  iconName?: MapPinIcon
  data: unknown
  color?: string
}

/**
 * Inline SVG icons.
 *
 * Northstar used MUI v4 icons through its `Icon` component, but Cloudscape
 * does not expose an equivalent icon set, so we render small SVGs directly
 * to keep the dependency surface minimal.
 */
const PinSVG: FC<{ name: MapPinIcon | undefined; color: string | undefined }> = ({ name, color = '#1f78b4' }) => {
  const common = { width: 26, height: 26, viewBox: '0 0 24 24', fill: color }
  switch (name) {
    case 'house':
      return (
        <svg {...common} aria-hidden='true'>
          <path d='M12 3 2 12h3v8h6v-6h2v6h6v-8h3L12 3z' />
        </svg>
      )
    case 'face':
      return (
        <svg {...common} aria-hidden='true'>
          <circle cx='12' cy='12' r='10' />
          <circle cx='9' cy='10' r='1.2' fill='#fff' />
          <circle cx='15' cy='10' r='1.2' fill='#fff' />
          <path d='M8 15c1.2 1.5 2.6 2 4 2s2.8-.5 4-2' stroke='#fff' strokeWidth='1.5' fill='none' />
        </svg>
      )
    case 'restaurant':
      return (
        <svg {...common} aria-hidden='true'>
          <path d='M8 2v9H6V2H4v20h2v-9h2v9h2V2H8zm9 0c-2 0-4 2-4 6 0 3 2 5 4 5v9h2V13c2 0 4-2 4-5 0-4-2-6-4-6h-2z' />
        </svg>
      )
    case 'person':
    default:
      return (
        <svg {...common} aria-hidden='true'>
          <path d='M12 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 10c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5z' />
        </svg>
      )
  }
}

const MapPin: FC<IMapPin> = ({ longitude, latitude, data, iconName, color }) => {
  return (
    <Marker longitude={longitude} latitude={latitude} anchor='bottom'>
      <Popover
        position='top'
        size='large'
        triggerType='custom'
        header='Details'
        content={
          <div style={{ maxWidth: 480, maxHeight: 360, overflow: 'auto' }}>
            <ReactMarkdown>{`\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``}</ReactMarkdown>
          </div>
        }
      >
        <span style={{ cursor: 'pointer', display: 'inline-flex' }}>
          <PinSVG name={iconName} color={color} />
        </span>
      </Popover>
    </Marker>
  )
}

export default MapPin
