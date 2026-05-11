/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type PropsWithChildren } from 'react'
import type { Context } from 'react'
import { castDraft } from 'immer'
import { useImmer } from 'use-immer'
import type { IQuery } from '../../../services/base/queryService'

interface State<TData> {
  readonly items: TData[]
  readonly isLoading: boolean
}

interface Updater<TData> {
  readonly setItems: (items: TData[]) => void
  readonly refreshItems: () => void
  readonly getItem: (id: IdType) => Promise<void>
}

export type ContextInterface<TData> = [State<TData>, Updater<TData>]
export type IdSelector<TData> = (item: TData) => IdType

const contextStore: Record<string, Context<ContextInterface<any> | null>> = {}

export function createQueryContext<TData>(key: string): Context<ContextInterface<TData> | null> {
  if (contextStore[key] == null) {
    contextStore[key] = createContext<ContextInterface<TData> | null>(null)
  }
  return contextStore[key] as Context<ContextInterface<TData> | null>
}

type QueryProviderComponent = (props: PropsWithChildren) => React.ReactNode

const queryProviderStore: Record<string, QueryProviderComponent> = {}

export function createQueryProvider<TData, TService extends IQuery<TData>>(
  key: string,
  service: TService,
  idSelector?: IdSelector<TData>,
): QueryProviderComponent {
  const idSelect: IdSelector<TData> =
    idSelector ?? ((item: TData) => (item as unknown as { Id: IdType }).Id)

  if (queryProviderStore[key] == null) {
    const _queryProvider: QueryProviderComponent = ({ children }) => {
      const [state, updateState] = useImmer<State<TData>>({
        items: [],
        isLoading: false,
      })

      const stateRef = useRef<State<TData>>(state)
      stateRef.current = state

      const fetchItems = useCallback(async () => {
        updateState((draft) => {
          draft.isLoading = true
        })
        const items = await service.list()
        updateState((draft) => {
          draft.items = castDraft(items)
          draft.isLoading = false
        })
      }, [updateState])

      const fetchItem = useCallback(
        async (id: IdType) => {
          updateState((draft) => {
            draft.isLoading = true
          })
          const item = await service.getItem(id)
          updateState((draft) => {
            const index = draft.items.findIndex((x) => idSelect(x as TData) === idSelect(item))
            if (index < 0) {
              draft.items.push(castDraft(item))
            } else {
              draft.items[index] = castDraft(item)
            }
            draft.isLoading = false
          })
        },
        [updateState],
      )

      useEffect(() => {
        fetchItems()
      }, [fetchItems])

      const updater = useMemo<Updater<TData>>(
        () => ({
          setItems: (items) => {
            updateState((draft) => {
              draft.items = castDraft(items)
            })
          },
          refreshItems: () => {
            void fetchItems()
          },
          getItem: async (id) => {
            await fetchItem(id)
          },
        }),
        [updateState, fetchItems, fetchItem],
      )

      const contextValue = useMemo<ContextInterface<TData>>(() => [state, updater], [state, updater])

      const QueryContext = createQueryContext<TData>(key)

      return <QueryContext.Provider value={contextValue}>{children}</QueryContext.Provider>
    }

    queryProviderStore[key] = _queryProvider
  }

  return queryProviderStore[key]
}

export function useQueryContext<TData>(key: string): ContextInterface<TData> {
  const queryContext = createQueryContext<TData>(key)
  const context = useContext(queryContext)

  if (context == null) {
    throw new Error(`QueryContext<${key}> is null`)
  }

  return context
}
