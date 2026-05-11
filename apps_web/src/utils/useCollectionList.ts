/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { useMemo, useState } from 'react'
import type { TableProps } from '@cloudscape-design/components'

export interface SortKey<T> {
  field: keyof T & string
  descending?: boolean
}

export interface UseCollectionListOptions<T> {
  /** Items array owned by a parent context. */
  items: T[]
  /** Initial sort state. Maps 1:1 to the original project's `sortBy[0]`. */
  defaultSort?: SortKey<T>
  /** Secondary sort tiebreaker, applied when two items compare equal on `defaultSort`. */
  secondarySort?: SortKey<T>
  /** Column definitions used to resolve a clicked header back to the underlying field name. */
  columnDefinitions: TableProps.ColumnDefinition<T>[]
  /** Default page size. Original project used 25 with selector for [25, 50, 100]. */
  defaultPageSize?: number
}

export interface UseCollectionListReturn<T> {
  /** Slice of items for the current page, after sort. */
  pageItems: T[]
  /** Pagination state for <Pagination /> */
  pagination: {
    currentPageIndex: number
    pagesCount: number
    onChange: (detail: { currentPageIndex: number }) => void
  }
  /** Preferences for <CollectionPreferences /> (page size selector). */
  preferences: {
    pageSize: number
    setPageSize: (size: number) => void
    pageSizeOptions: readonly { value: number; label: string }[]
  }
  /** Sorting state for Cloudscape <Table /> */
  sorting: {
    sortingColumn: TableProps.SortingColumn<T> | undefined
    sortingDescending: boolean
    onSortingChange: (detail: { sortingColumn: TableProps.SortingColumn<T>; isDescending?: boolean }) => void
  }
}

const DEFAULT_PAGE_SIZE_OPTIONS = [
  { value: 25, label: '25' },
  { value: 50, label: '50' },
  { value: 100, label: '100' },
] as const

const cmp = (a: unknown, b: unknown): number => {
  if (a == null && b == null) return 0
  if (a == null) return -1
  if (b == null) return 1
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b))
}

/**
 * Client-side list collection helper that mirrors the behaviour the original
 * aws-northstar <Table /> provided out of the box:
 *   - initial sort (sortBy[0])
 *   - secondary tiebreaker sort (sortBy[1])
 *   - header-click sorting
 *   - pagination
 *   - page size selection [25, 50, 100]
 */
export function useCollectionList<T>({
  items,
  defaultSort,
  secondarySort,
  columnDefinitions,
  defaultPageSize = 25,
}: UseCollectionListOptions<T>): UseCollectionListReturn<T> {
  const initialSortingColumn = useMemo<TableProps.SortingColumn<T> | undefined>(() => {
    if (!defaultSort) return undefined
    const match = columnDefinitions.find((c) => c.sortingField === defaultSort.field)
    return match as TableProps.SortingColumn<T> | undefined
  }, [defaultSort, columnDefinitions])

  const [sortingColumn, setSortingColumn] = useState<TableProps.SortingColumn<T> | undefined>(initialSortingColumn)
  const [sortingDescending, setSortingDescending] = useState<boolean>(defaultSort?.descending ?? false)

  const [pageSize, setPageSize] = useState<number>(defaultPageSize)
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(1)

  const sortedItems = useMemo(() => {
    const primaryField = (sortingColumn?.sortingField ?? defaultSort?.field) as keyof T | undefined
    const primaryDesc = sortingDescending

    const copy = [...items]
    if (!primaryField && !secondarySort) {
      return copy
    }

    copy.sort((a, b) => {
      if (primaryField) {
        const diff = cmp(a[primaryField], b[primaryField])
        if (diff !== 0) return primaryDesc ? -diff : diff
      }
      if (secondarySort) {
        const sField = secondarySort.field as keyof T
        const diff2 = cmp(a[sField], b[sField])
        if (diff2 !== 0) return secondarySort.descending ? -diff2 : diff2
      }
      return 0
    })
    return copy
  }, [items, sortingColumn, sortingDescending, defaultSort, secondarySort])

  const pagesCount = Math.max(1, Math.ceil(sortedItems.length / pageSize))
  const safePageIndex = Math.min(currentPageIndex, pagesCount)
  const pageItems = useMemo(
    () => sortedItems.slice((safePageIndex - 1) * pageSize, safePageIndex * pageSize),
    [sortedItems, safePageIndex, pageSize],
  )

  return {
    pageItems,
    pagination: {
      currentPageIndex: safePageIndex,
      pagesCount,
      onChange: ({ currentPageIndex: next }) => setCurrentPageIndex(next),
    },
    preferences: {
      pageSize,
      setPageSize: (size) => {
        setPageSize(size)
        setCurrentPageIndex(1)
      },
      pageSizeOptions: DEFAULT_PAGE_SIZE_OPTIONS,
    },
    sorting: {
      sortingColumn,
      sortingDescending,
      onSortingChange: ({ sortingColumn: col, isDescending }) => {
        setSortingColumn(col)
        setSortingDescending(isDescending ?? false)
      },
    },
  }
}
