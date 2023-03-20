/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { ReactNode } from 'react'
import { Badge } from 'aws-northstar'

const badgesCache: Record<string, ReactNode> = {
  Failed: <Badge content='Failed' color='red' />,
  Succeeded: <Badge content='Succeeded' color='green' />,
  Executing: <Badge content='Executing' color='blue' />,
  Starting: <Badge content='Starting' color='grey' />,
  warning: <Badge content='warning' color='red' />,
  error: <Badge content='error' color='red' />,
  debug: <Badge content='debug' color='blue' />,
  info: <Badge content='info' color='grey' />,
}
export const getStatusBadge = (status: string): ReactNode => {
  const badge = badgesCache[status]

  if (badge == null) {
    return <Badge content={status} color='grey' />
  }

  return badge
}
