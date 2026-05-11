/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type PropsWithChildren } from 'react'
import type { Context } from 'react'
import { castDraft } from 'immer'
import { useImmer } from 'use-immer'
import type { IService } from '../../../services/base/crudService'

interface State<TData> {
  readonly items: TData[]
  readonly isLoading: boolean
}

interface Updater<TData> {
  readonly setItems: (items: TData[]) => void
  readonly refreshItems: () => void
  readonly getItem: (id: IdType) => Promise<void>
  readonly createItem: (item: TData) => Promise<void>
  readonly updateItem: (item: TData, persist?: boolean) => void
  readonly deleteItem: (id: IdType) => Promise<void>
}

export type ContextInterface<TData> = [State<TData>, Updater<TData>]
export type IdSelector<TData> = (item: TData) => IdType

const contextStore: Record<string, Context<ContextInterface<any> | null>> = {}

export function createDataContext<TData>(key: string): Context<ContextInterface<TData> | null> {
  if (contextStore[key] == null) {
    contextStore[key] = createContext<ContextInterface<TData> | null>(null)
  }
  return contextStore[key] as Context<ContextInterface<TData> | null>
}

type DataProviderComponent = (props: PropsWithChildren) => React.ReactNode

const dataProviderStore: Record<string, DataProviderComponent> = {}

export function createDataProvider<TData, TService extends IService<TData>>(
  key: string,
  service: TService,
  idSelector?: IdSelector<TData>,
): DataProviderComponent {
  const idSelect: IdSelector<TData> =
    idSelector ?? ((item: TData) => (item as unknown as { Id: IdType }).Id)

  if (dataProviderStore[key] == null) {
    const _dataProvider: DataProviderComponent = ({ children }) => {
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
          createItem: async (item) => {
            updateState((draft) => {
              draft.isLoading = true
            })
            const newItem = await service.create(item)
            updateState((draft) => {
              draft.items.push(castDraft(newItem))
              draft.isLoading = false
            })
          },
          updateItem: (item, persist) => {
            updateState((draft) => {
              const index = draft.items.findIndex((a) => idSelect(a as TData) === idSelect(item))
              if (index < 0) {
                throw new Error(`Failed to find item with id ${idSelect(item)}`)
              }
              draft.items[index] = castDraft(item)
            })

            if (persist) {
              void (async () => {
                const updated = await service.update(item)
                updateState((draft) => {
                  const index = draft.items.findIndex((a) => idSelect(a as TData) === idSelect(updated))
                  if (index >= 0) {
                    draft.items[index] = castDraft(updated)
                  }
                })
              })()
            }
          },
          deleteItem: async (id) => {
            updateState((draft) => {
              draft.isLoading = true
            })
            await service.deleteItem(id)
            updateState((draft) => {
              draft.items = draft.items.filter((a) => idSelect(a as TData) !== id)
              draft.isLoading = false
            })
          },
        }),
        [updateState, fetchItems, fetchItem],
      )

      const contextValue = useMemo<ContextInterface<TData>>(() => [state, updater], [state, updater])

      const DataContext = createDataContext<TData>(key)

      return <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>
    }

    dataProviderStore[key] = _dataProvider
  }

  return dataProviderStore[key]
}

export function useDataContext<TData>(key: string): ContextInterface<TData> {
  const dataContext = createDataContext<TData>(key)
  const context = useContext(dataContext)

  if (context == null) {
    throw new Error(`DataContext<${key}> is null`)
  }

  return context
}
