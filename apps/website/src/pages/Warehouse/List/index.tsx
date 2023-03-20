/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { Button, Inline, Table, ButtonIcon } from 'aws-northstar'
import { FunctionComponent } from 'react'
import { useHistory } from 'react-router-dom'
import { useWarehouseContext } from '../../../contexts/WarehouseContext'
import { columnDefinitions } from './table-columns'
import { appvars } from '../../../config'

export const List: FunctionComponent = () => {
  const history = useHistory()
  const [{ items: warehouseItems, isLoading }, { refreshItems }] = useWarehouseContext()

  const onRefreshClick = async () => {
    refreshItems()
  }

  const onCreateClick = () => {
    history.push(`/${appvars.URL.WAREHOUSE}/new`)
  }

  const tableActions = (
    <Inline>
      <Button onClick={onRefreshClick}>
        <ButtonIcon type='refresh' />
      </Button>
      <Button onClick={onCreateClick} variant='primary'>
        New Warehouse
      </Button>
    </Inline>
  )

  return (
    <Table
      tableTitle={'Warehouse List'}
      columnDefinitions={columnDefinitions}
      items={warehouseItems}
      loading={isLoading}
      actionGroup={tableActions}
      multiSelect={false}
      disableRowSelect={true}
      defaultPageSize={25}
      sortBy={[{ id: 'createdAt', desc: true }]}
      pageSizes={[25, 50, 100]}
      rowCount={warehouseItems.length}
    />
  )
}
