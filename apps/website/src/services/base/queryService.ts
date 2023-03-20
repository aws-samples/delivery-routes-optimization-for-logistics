/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { API } from 'aws-amplify'
import { appvars } from '../../config'

const {
  BACKENDVARS: { API_DS_NAME },
} = appvars

export interface QueryServiceHooks<T> {
  readonly listHook?: (list: T[]) => T[]
}

export interface IQuery<T> {
  getItem(id: IdType): Promise<T>
  list(): Promise<T[]>
}

export class QueryService<TData> implements IQuery<TData> {
  protected serviceName: string

  protected endpoint: string

  private hooks: QueryServiceHooks<TData>

  constructor(serviceName: string, endpoint: string, hooks: QueryServiceHooks<TData>) {
    this.serviceName = serviceName
    this.endpoint = endpoint
    this.hooks = hooks
  }

  async getItem(id: IdType): Promise<TData> {
    try {
      const response = await API.get(API_DS_NAME, `/${this.endpoint}/${id}`, {})
      const {
        data: { Item },
      } = response
      console.debug(`[api::${this.serviceName}::get] Received:`, Item)

      let item = Item as TData

      if (this.hooks.listHook != null) {
        item = this.hooks.listHook([item])[0]
      }

      return item
    } catch (err) {
      console.error(`[api::${this.serviceName}::get] Error while retrieving data`, err)
      throw err
    }
  }

  async list(): Promise<TData[]> {
    try {
      const response = await API.get(API_DS_NAME, `/${this.endpoint}`, {})
      const {
        data: { Items },
      } = response
      console.debug(`[api::${this.serviceName}::list] Received:`, Items)

      let items = Items as TData[]

      if (this.hooks.listHook != null) {
        items = this.hooks.listHook(items)
      }

      return items
    } catch (err) {
      console.error(`[api::${this.serviceName}::list] Error while retrieving data`, err)
      throw err
    }
  }
}
