/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef } from 'react'
import { castDraft } from 'immer'
import { useImmer } from 'use-immer'
import { IQuery } from '../../../services/base/queryService'

interface State<TData> {
  readonly items: TData[]
  readonly isLoading: boolean
}

interface Updater<TData> {
  readonly setItems: (items: TData[]) => void
  readonly refreshItems: () => void

  readonly getItem: (id: IdType) => Promise<void>
  // readonly createItem: (item: TData) => void
  // readonly updateItem: (item: TData, persist?: boolean) => void
}

export type ContextInterface<TData> = [State<TData>, Updater<TData>]
export type IdSelector<TData> = (item: TData) => IdType

const contextStore: Record<string, any> = {}
export function createQueryContext<TData>(key: string): React.Context<ContextInterface<TData> | null> {
  if (contextStore[key] == null) {
    contextStore[key] = createContext<ContextInterface<TData> | null>(null)
  }

  return contextStore[key]
}

const queryProviderStore: Record<string, any> = {}
export function createQueryProvider<TData, TService extends IQuery<TData>>(
  key: string,
  service: TService,
  idSelector?: IdSelector<TData>,
): any {
  const idSelect: IdSelector<TData> =
    idSelector ||
    ((item: TData) => {
      return (item as any).Id as IdType
    })

  if (queryProviderStore[key] == null) {
    const _queryProvider = ({ children }: PropsWithChildren<any>): any => {
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
          })
        },
        [updateState],
      )

      useEffect(() => {
        fetchItems()
      }, [fetchItems])

      const updater = useMemo<Updater<TData>>((): Updater<TData> => {
        return {
          setItems: (items: TData[]): void => {
            updateState((draft) => {
              draft.items = castDraft(items)
            })
          },

          refreshItems: (): void => {
            ;(async () => {
              await fetchItems()
            })()
          },

          getItem: async (id: IdType): Promise<void> => {
            await fetchItem(id)
          },
        }
      }, [updateState, fetchItems, fetchItem])

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
