/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { Button, Inline, Table, ButtonIcon } from 'aws-northstar'
import { FunctionComponent } from 'react'
import { useHistory } from 'react-router-dom'
import { useCustomerLocationContext } from '../../../contexts/CustomerLocationContext'
import { columnDefinitions } from './table-columns'
import { appvars } from '../../../config'

export const List: FunctionComponent = () => {
  const history = useHistory()
  const [{ items: customerLocationItems, isLoading }, { refreshItems }] = useCustomerLocationContext()

  const onRefreshClick = async () => {
    refreshItems()
  }

  const onCreateClick = () => {
    history.push(`/${appvars.URL.CUSTOMER_LOCATION}/new`)
  }

  const tableActions = (
    <Inline>
      <Button onClick={onRefreshClick}>
        <ButtonIcon type='refresh' />
      </Button>
      <Button onClick={onCreateClick} variant='primary'>
        New Customer
      </Button>
    </Inline>
  )

  return (
    <Table
      tableTitle={'Customer List'}
      columnDefinitions={columnDefinitions}
      items={customerLocationItems}
      loading={isLoading}
      actionGroup={tableActions}
      multiSelect={false}
      disableRowSelect={true}
      defaultPageSize={25}
      sortBy={[{ id: 'createdAt', desc: true }]}
      pageSizes={[25, 50, 100]}
      rowCount={customerLocationItems.length}
    />
  )
}
