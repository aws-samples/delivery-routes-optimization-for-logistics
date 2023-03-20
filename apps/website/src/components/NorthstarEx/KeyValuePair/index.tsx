/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { FunctionComponent } from 'react'
import { Box, Text } from 'aws-northstar'
import { KeyValuePairProps as NSKeyValuePairProps } from 'aws-northstar/components/KeyValuePair'
import { InfoPopover, InfoPopoverProps } from '../../InfoPopover'

type KeyValuePairProps = NSKeyValuePairProps & InfoPopoverProps

export const KeyValuePair: FunctionComponent<KeyValuePairProps> = ({
  infoKey,
  infoHeader,
  infoValues,
  infoPopoverVariant,
  ...keyValuePairProps
}) => {
  const { label, value } = keyValuePairProps

  let infoPopover = null

  if (infoKey != null || infoValues != null) {
    infoPopover = (
      <InfoPopover
        infoKey={infoKey}
        infoValues={infoValues}
        infoPopoverVariant={infoPopoverVariant}
        infoIconFontSize='small'
        infoHeader={infoHeader || label}
      />
    )
  }

  return (
    <Box>
      <Box color='grey.600' fontSize='body1.fontSize'>
        {label}
        {infoPopover}
      </Box>
      <Box data-testid='value' color='text.primary'>
        {!value ? (
          <Text>-</Text>
        ) : typeof value === 'string' || typeof value === 'number' ? (
          <Text>{value}</Text>
        ) : (
          <>{value}</>
        )}
      </Box>
    </Box>
  )
}
