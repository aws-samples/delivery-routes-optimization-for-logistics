/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import type { FC } from 'react'
import { CollectionPreferences, type CollectionPreferencesProps } from '@cloudscape-design/components'

interface TablePreferencesProps {
  pageSize: number
  onPageSizeChange: (size: number) => void
  pageSizeOptions: readonly { value: number; label: string }[]
}

/**
 * A minimal Cloudscape <CollectionPreferences /> wrapper exposing only the
 * page size selector. Restores the `[25, 50, 100]` selector that aws-northstar
 * `<Table pageSizes={...} />` provided natively.
 */
const TablePreferences: FC<TablePreferencesProps> = ({ pageSize, onPageSizeChange, pageSizeOptions }) => {
  return (
    <CollectionPreferences
      title='Preferences'
      confirmLabel='Confirm'
      cancelLabel='Cancel'
      preferences={{ pageSize }}
      pageSizePreference={{
        title: 'Page size',
        options: pageSizeOptions.map((o) => ({ value: o.value, label: o.label })),
      }}
      onConfirm={({ detail }: { detail: CollectionPreferencesProps.Preferences }) => {
        if (detail.pageSize != null) {
          onPageSizeChange(detail.pageSize)
        }
      }}
    />
  )
}

export default TablePreferences
