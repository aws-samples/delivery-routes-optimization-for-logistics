/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { Button, Inline, Table, ButtonIcon } from 'aws-northstar'
import { FunctionComponent } from 'react'
import { useHistory } from 'react-router-dom'
import { useOrderContext } from '../../../contexts/OrderQueryContext'
import { columnDefinitions } from './table-columns'
import { appvars } from '../../../config'

export const List: FunctionComponent = () => {
  const history = useHistory()
  const [{ items: orderItems, isLoading }, { refreshItems }] = useOrderContext()
  const onRefreshClick = async () => {
    refreshItems()
  }

  const onCreateClick = () => {
    history.push(`/${appvars.URL.ORDER}/new`) // ORDER VEHICLE
  }

  const tableActions = (
    <Inline>
      <Button onClick={onRefreshClick}>
        <ButtonIcon type='refresh' />
      </Button>
      <Button onClick={onCreateClick} variant='primary'>
        New Order
      </Button>
    </Inline>
  )

  return (
    <Table
      tableTitle={'Order List'}
      columnDefinitions={columnDefinitions}
      items={orderItems}
      loading={isLoading}
      actionGroup={tableActions}
      multiSelect={false}
      disableRowSelect={true}
      defaultPageSize={25}
      sortBy={[
        { id: 'orderDate', desc: true },
        { id: 'orderNo', desc: false },
      ]}
      pageSizes={[25, 50, 100]}
      rowCount={orderItems.length}
    />
  )
}
