/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef } from 'react'
import { castDraft } from 'immer'
import { useImmer } from 'use-immer'
import { sortBy } from 'lodash'
import { IService } from '../../../services/base/crudService'

interface State<TData> {
  readonly items: TData[]
  readonly isLoading: boolean
}

interface Updater<TData> {
  readonly setItems: (items: TData[]) => void
  readonly refreshItems: () => void

  readonly getItem: (id: IdType) => Promise<void>
  readonly createItem: (item: TData) => void
  readonly updateItem: (item: TData, persist?: boolean) => void
  readonly deleteItem: (id: IdType) => Promise<void>
}

export type ContextInterface<TData> = [State<TData>, Updater<TData>]
export type IdSelector<TData> = (item: TData) => IdType

const contextStore: Record<string, any> = {}
export function createDataContext<TData>(key: string): React.Context<ContextInterface<TData> | null> {
  if (contextStore[key] == null) {
    contextStore[key] = createContext<ContextInterface<TData> | null>(null)
  }

  return contextStore[key]
}

const dataProviderStore: Record<string, any> = {}
export function createDataProvider<TData, TService extends IService<TData>>(
  key: string,
  service: TService,
  idSelector?: IdSelector<TData>,
): any {
  const idSelect: IdSelector<TData> =
    idSelector ||
    ((item: TData) => {
      return (item as any).Id as IdType
    })

  if (dataProviderStore[key] == null) {
    const _dataProvider = ({ children }: PropsWithChildren<any>): any => {
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

          createItem: async (item: TData): Promise<void> => {
            updateState((draft) => {
              draft.isLoading = true
            })
            const newItem = await service.create(item)

            updateState((draft) => {
              draft.items.push(castDraft(newItem))
              draft.isLoading = false
            })
          },

          updateItem: (item: TData, persist?: boolean): void => {
            updateState((draft) => {
              const index = draft.items.findIndex((a) => idSelect(a as TData) === idSelect(item))

              if (index < 0) {
                throw new Error(`Failed to find item with id ${idSelect(item)}`)
              }

              draft.items[index] = castDraft(item)

              if (persist) {
                ;(async () => {
                  const updated = await service.update(item)
                  updateState((draft_) => {
                    draft_.items[index] = castDraft(updated)
                  })
                })()
              }
            })
          },

          deleteItem: async (id: IdType): Promise<void> => {
            updateState((draft) => {
              draft.isLoading = true
            })

            await service.deleteItem(id)

            updateState((draft) => {
              const newDataItems = draft.items.filter((a) => idSelect(a as TData) !== id)
              draft.items = newDataItems
              draft.isLoading = false
            })
          },
        }
      }, [updateState, fetchItems, fetchItem])

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
