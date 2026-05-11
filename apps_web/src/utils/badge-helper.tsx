/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import type { ReactNode } from 'react'
import { Badge } from '@cloudscape-design/components'

type CloudscapeBadgeColor = 'blue' | 'grey' | 'green' | 'red' | 'severity-critical' | 'severity-high'

const toColor = (status: string): CloudscapeBadgeColor => {
  switch (status) {
    case 'Failed':
    case 'warning':
    case 'error':
      return 'red'
    case 'Succeeded':
      return 'green'
    case 'Executing':
    case 'debug':
      return 'blue'
    case 'Starting':
    case 'info':
    default:
      return 'grey'
  }
}

export const getStatusBadge = (status: string): ReactNode => {
  return <Badge color={toColor(status)}>{status}</Badge>
}
