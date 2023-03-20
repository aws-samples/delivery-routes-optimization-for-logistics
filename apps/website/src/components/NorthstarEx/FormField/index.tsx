/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { FunctionComponent } from 'react'
import NSFormField, { FormFieldProps as NSFormFieldProps } from 'aws-northstar/components/FormField'
import { InfoPopover, InfoPopoverProps } from '../../InfoPopover'

type FormFieldProps = NSFormFieldProps & InfoPopoverProps

export const FormField: FunctionComponent<FormFieldProps> = ({
  infoKey,
  infoHeader,
  infoValues,
  infoPopoverVariant,
  ...formFieldProps
}) => {
  if (infoKey == null) {
    return <NSFormField {...formFieldProps} />
  }

  const { label } = formFieldProps

  const infoPopover = (
    <InfoPopover
      infoKey={infoKey}
      infoValues={infoValues}
      infoPopoverVariant={infoPopoverVariant}
      infoIconFontSize='small'
      infoHeader={infoHeader || typeof label === 'string' ? (label as string) : undefined}
    />
  )

  let labelWithInfo = null

  if (label == null) {
    labelWithInfo = infoPopover
  } else {
    labelWithInfo = (
      <>
        {label}
        {infoPopover}
      </>
    )
  }

  return <NSFormField {...formFieldProps} label={labelWithInfo} />
}
