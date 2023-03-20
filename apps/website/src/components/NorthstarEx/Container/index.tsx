/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { FunctionComponent } from 'react'
import NSContainer, { ContainerProps as NSContainerProps } from 'aws-northstar/layouts/Container'
import { InfoPopover, InfoPopoverProps } from '../../InfoPopover'

type ContainerProps = NSContainerProps & InfoPopoverProps

export const Container: FunctionComponent<ContainerProps> = ({
  infoKey,
  infoHeader,
  infoValues,
  infoPopoverVariant,
  actionGroup,
  ...containerProps
}) => {
  if (infoKey == null) {
    return <NSContainer actionGroup={actionGroup} {...containerProps} />
  }

  let actionGroupWithInfo = null
  const infoPopover = (
    <InfoPopover
      infoKey={infoKey}
      infoValues={infoValues}
      infoPopoverVariant={infoPopoverVariant}
      infoIconFontSize='default'
      infoHeader={infoHeader || containerProps.title}
    />
  )

  if (actionGroup == null) {
    actionGroupWithInfo = infoPopover
  } else {
    actionGroupWithInfo = (
      <>
        {actionGroup}
        {infoPopover}
      </>
    )
  }

  return <NSContainer {...containerProps} actionGroup={actionGroupWithInfo} />
}
