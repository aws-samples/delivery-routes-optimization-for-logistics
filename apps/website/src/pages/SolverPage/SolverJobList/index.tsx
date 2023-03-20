/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { Button, Inline, Table, ButtonIcon } from 'aws-northstar'
import { FunctionComponent } from 'react'
import { useHistory } from 'react-router-dom'
import { columnDefinitions } from './table-columns'
import { appvars } from '../../../config'
import { useSolverJobQueryContext } from 'src/contexts/SolverJobQueryContext'

export const SolverJobList: FunctionComponent = () => {
  const history = useHistory()
  const [{ items: solverJobItems, isLoading }, { refreshItems }] = useSolverJobQueryContext()

  const onRefreshClick = async () => {
    refreshItems()
  }

  const onCreateClick = () => {
    history.push(`/${appvars.URL.SOLVER_JOB}/new`)
  }

  const tableActions = (
    <Inline>
      <Button onClick={onRefreshClick}>
        <ButtonIcon type='refresh' />
      </Button>
    </Inline>
  )

  return (
    <Table
      tableTitle={'Solver Job List'}
      columnDefinitions={columnDefinitions}
      items={solverJobItems}
      loading={isLoading}
      actionGroup={tableActions}
      multiSelect={false}
      disableRowSelect={true}
      defaultPageSize={25}
      sortBy={[{ id: 'createdAt', desc: true }]}
      pageSizes={[25, 50, 100]}
      rowCount={solverJobItems.length}
    />
  )
}
