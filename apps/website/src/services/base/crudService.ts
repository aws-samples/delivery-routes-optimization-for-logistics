/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { API } from 'aws-amplify'
import { appvars } from '../../config'

const {
  BACKENDVARS: { API_DS_NAME },
} = appvars

export interface CrudServiceHooks<T> {
  readonly listHook?: (list: T[]) => T[]
  readonly createHook?: (item: T) => T
  readonly updateHook?: (item: T) => T
}

export interface IService<T> {
  getItem(id: IdType): Promise<T>
  list(): Promise<T[]>
  create(data: T): Promise<T>
  update(data: T): Promise<T>
  deleteItem(id: IdType): Promise<void>
}

export class CrudService<TData> implements IService<TData> {
  protected serviceName: string

  protected endpoint: string

  private hooks: CrudServiceHooks<TData>

  constructor(serviceName: string, endpoint: string, hooks: CrudServiceHooks<TData>) {
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

  async create(data: TData): Promise<TData> {
    try {
      const response: any = await API.post(API_DS_NAME, `/${this.endpoint}`, { body: data })
      const {
        data: { Item },
      } = response
      console.debug(`[api::${this.serviceName}::create] created:`, Item)

      let item = Item as TData

      if (this.hooks.createHook != null) {
        item = this.hooks.createHook(item)
      }

      return item
    } catch (err) {
      console.error(`[api::${this.serviceName}::create] Error while creating ${this.serviceName}`, err)
      throw err
    }
  }

  async update(data: TData): Promise<TData> {
    try {
      const response = await API.put(API_DS_NAME, `/${this.endpoint}`, { body: data })
      const {
        data: { Item },
      } = response
      console.debug(`[api::${this.serviceName}::update] updated:`, Item)

      let item = Item as TData

      if (this.hooks.updateHook != null) {
        item = this.hooks.updateHook(item)
      }

      return item
    } catch (err) {
      console.error(`[api::${this.serviceName}::update] Error while updating`, err)
      throw err
    }
  }

  async deleteItem(id: IdType): Promise<void> {
    try {
      const response = await API.del(API_DS_NAME, `/${this.endpoint}/${id}`, {})
      const { data } = response
      console.debug(`[api::${this.serviceName}::delete] Successfully deleted with id ${id}`, data)
    } catch (err) {
      console.error(`[api::${this.serviceName}::delete] Error while deleting with id ${id}`, err)
      throw err
    }
  }
}
