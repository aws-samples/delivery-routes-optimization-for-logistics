/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import type { FunctionComponent, ReactNode } from 'react'
import { Icon, Popover } from '@cloudscape-design/components'

export interface InfoPopoverProps {
  infoPopoverVariant?: 'hover' | 'click'
  infoKey?: string | number
  infoHeader?: string
  infoValues?: Record<string, string | ReactNode>
  infoIconFontSize?: 'small' | 'medium' | 'big' | 'large' | 'normal' | 'inherit'
}

/**
 * A lightweight information popover rendered as a small info icon.
 *
 * The original implementation relied on `react-intl` for message lookup by key,
 * but this project never configured `IntlProvider`, so messages were effectively
 * rendered as raw ids. We simplify to render `infoHeader` / `infoKey` directly.
 */
export const InfoPopover: FunctionComponent<InfoPopoverProps> = ({
  infoKey,
  infoHeader = 'Info',
}) => {
  const body: ReactNode = infoKey != null ? String(infoKey) : null

  return (
    <Popover position='bottom' size='medium' triggerType='custom' header={infoHeader} content={body}>
      <span style={{ paddingLeft: 3, paddingRight: 3, cursor: 'help' }} aria-label={infoHeader}>
        <Icon name='status-info' variant='link' />
      </span>
    </Popover>
  )
}
