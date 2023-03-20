/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

/* eslint-disable @typescript-eslint/no-var-requires */
import React, { useContext } from 'react'
import Icon, { IconName } from 'aws-northstar/components/Icon'
import Popover from 'aws-northstar/components/Popover'
import MarkdownViewer from 'aws-northstar/components/MarkdownViewer'
import { MapContext } from 'react-map-gl'

export type IMapPin = {
  longitude: number
  latitude: number
  iconName?: IconName
  data: any
  color?: string
}

const MapPin: React.FC<IMapPin> = ({ longitude, latitude, data, iconName, color }) => {
  const context = useContext(MapContext)
  const [x, y] = context.viewport?.project([longitude, latitude]) || [undefined, undefined]

  return (
    <>
      {x && y && (
        <div style={{ position: 'absolute', left: x - 15, top: y - 30, color: color }}>
          <Popover
            position='top'
            size='large'
            triggerType='custom'
            content={<MarkdownViewer>{`\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``}</MarkdownViewer>}
          >
            <Icon name={iconName || 'PersonPinCircle'} fontSize='large' color={'inherit'} htmlColor={color} />
          </Popover>
        </div>
      )}
    </>
  )
}

export default MapPin
