/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { Button, Inline, Stack, Container, ButtonIcon, Table, Grid } from 'aws-northstar'
import { FunctionComponent, useEffect, useState } from 'react'
import { useHistory, useParams } from 'react-router-dom'
import { useDeliveryJobQueryContext } from '../../../contexts/DeliveryJobQueryContext'
import { columnDefinitions, columnDefinitions1 } from './table-columns'
import { appvars } from '../../../config'
import NextDayDeliveryMapComponent from '../../../components/MapComponent/NextDayDeliveryMap'
import NextDayDelivery from '../../../api/NextDayDelivery'

export const DeliveryJobList: FunctionComponent = () => {
  const history = useHistory()
  const { solverJobId } = useParams<{ solverJobId: string }>()

  const [loading, setLoading] = useState(false)
  const [solverJob, setSolverJob] = useState<any>()
  const [deliveryJobs, setDeliveryJobs] = useState<any>([])
  const [selectedDeliveryJobs, setSelectedDeliveryJobs] = useState<any>()
  const [nextToken, setNextToken] = useState(undefined)
  const [selectedDeliverySegment, setSelectedDeliverySegment] = useState<any>([])

  const fetchSolverJob = async () => {
    try {
      setLoading(true)
      const result = await NextDayDelivery.getSolverJobById(solverJobId)
      setSolverJob(result.data.Items)
    } catch (err) {
      console.log(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchDeliveryJobs = async (nextToken?: string, hardRefresh = false) => {
    try {
      setLoading(true)
      const result = await NextDayDelivery.getDeliveryJobsBySolverJob(solverJobId, nextToken)

      if (!hardRefresh) {
        setDeliveryJobs((old: any) => [...old, ...result.data.Items])
      } else {
        setDeliveryJobs(result.data.Items)
      }

      setNextToken(result.data.nextToken)
    } catch (err) {
      console.log(err)
    } finally {
      setLoading(false)
    }
  }

  const loadNextPage = () => {
    fetchDeliveryJobs(nextToken)
  }

  // Call only first render
  useEffect(() => {
    fetchSolverJob()
    fetchDeliveryJobs()
  }, [])

  useEffect(() => {
    if (selectedDeliveryJobs) {
      setSelectedDeliverySegment(selectedDeliveryJobs.segments)
    }
  }, [selectedDeliveryJobs])

  const onDeliveryJobChange = (selectedItems: any[]) => {
    if (selectedItems.length > 0) {
      setSelectedDeliveryJobs(selectedItems[0])
    } else {
      setSelectedDeliveryJobs(null)
    }
  }

  const onRefreshClick = async () => {
    fetchDeliveryJobs(undefined, true)
  }

  const onCreateClick = () => {
    history.push(`/${appvars.URL.DELIVERY_JOB}/new`)
  }

  const tableActions = (
    <Inline>
      <Button onClick={onRefreshClick}>
        <ButtonIcon type='refresh' />
      </Button>
    </Inline>
  )

  return (
    <Container>
      <Grid container spacing={3}>
        <Grid item xs={6}>
          <Stack>
            <Table
              tableTitle={'Vehicles'}
              columnDefinitions={columnDefinitions}
              items={deliveryJobs}
              loading={loading}
              actionGroup={tableActions}
              multiSelect={false}
              disableRowSelect={false}
              defaultPageSize={25}
              sortBy={[{ id: 'createdAt', desc: true }]}
              pageSizes={[25, 50, 100]}
              rowCount={deliveryJobs.length}
              onSelectionChange={onDeliveryJobChange}
            />
          </Stack>
        </Grid>
        <Grid item xs={6}>
          <Stack>
            <Table
              tableTitle={'Assigned orders for selected vehicle'}
              columnDefinitions={columnDefinitions1}
              items={selectedDeliverySegment}
              loading={loading}
              actionGroup={tableActions}
              multiSelect={false}
              disableRowSelect={true}
              defaultPageSize={25}
              sortBy={[{ id: 'createdAt', desc: true }]}
              pageSizes={[25, 50, 100]}
              rowCount={selectedDeliverySegment.length}
              onSelectionChange={onDeliveryJobChange}
            />
            <NextDayDeliveryMapComponent
              segments={selectedDeliveryJobs ? selectedDeliveryJobs.segments : undefined}
              route={selectedDeliveryJobs ? selectedDeliveryJobs.route : undefined}
            />
          </Stack>
        </Grid>
      </Grid>
    </Container>
  )
}
