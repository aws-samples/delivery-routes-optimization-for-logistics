/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { ReactNode, FunctionComponent } from 'react'
import { Box, Popover } from 'aws-northstar'
import Icon from 'aws-northstar/components/Icon'
import { FormattedMessage } from 'react-intl'

export interface InfoPopoverProps {
  infoPopoverVariant?: 'hover' | 'click'
  infoKey?: string | number
  infoHeader?: string
  infoValues?: Record<string, string | ReactNode>
  infoIconFontSize?: 'small' | 'inherit' | 'default' | 'large'
}

export const InfoPopover: FunctionComponent<InfoPopoverProps> = ({
  infoPopoverVariant = 'hover',
  infoKey,
  infoHeader = 'Info',
  infoValues,
  infoIconFontSize = 'small',
}) => {
  const infoValuesWithTags = {
    ...infoValues,
    b: (content: string) => <b>{content}</b>,
    strong: (content: string) => <strong>{content}</strong>,
    p: (content: string) => <p>{content}</p>,
    i: (content: string) => <i>{content}</i>,
  }

  return (
    <Popover
      position='bottom'
      size='large'
      header={infoHeader}
      triggerType='text'
      variant={infoPopoverVariant}
      showDismissButton={infoPopoverVariant === 'click'}
      content={<FormattedMessage id={`${infoKey}`} values={infoValuesWithTags} />}
    >
      <Box style={{ paddingLeft: 3, paddingRight: 3 }}>
        <Icon variant='Outlined' color='action' name='Info' fontSize={infoIconFontSize} />
      </Box>
    </Popover>
  )
}
