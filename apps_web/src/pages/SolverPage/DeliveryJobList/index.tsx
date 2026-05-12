/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { useEffect, useState, type FunctionComponent } from 'react'
import { useParams } from 'react-router-dom'
import { Button, Container, Grid, Header, SpaceBetween, Table } from '@cloudscape-design/components'
import NextDayDelivery from '../../../api/NextDayDelivery'
import NextDayDeliveryMapComponent from '../../../components/MapComponent/NextDayDeliveryMap'
import { columnDefinitions, columnDefinitionsSegments } from './table-columns'

export const DeliveryJobList: FunctionComponent = () => {
  const { solverJobId } = useParams<{ solverJobId: string }>()

  const [loading, setLoading] = useState(false)
  const [deliveryJobs, setDeliveryJobs] = useState<any[]>([])
  const [selectedDeliveryJobs, setSelectedDeliveryJobs] = useState<any | null>(null)
  const [nextToken, setNextToken] = useState<string | undefined>(undefined)
  const [selectedDeliverySegment, setSelectedDeliverySegment] = useState<any[]>([])

  const fetchSolverJob = async () => {
    if (!solverJobId) return
    try {
      setLoading(true)
      await NextDayDelivery.getSolverJobById(solverJobId)
    } catch (err) {
      console.log(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchDeliveryJobs = async (nextTokenArg?: string, hardRefresh = false) => {
    if (!solverJobId) return
    try {
      setLoading(true)
      const result = await NextDayDelivery.getDeliveryJobsBySolverJob(solverJobId, nextTokenArg)
      const newItems = result?.data?.Items ?? []
      setDeliveryJobs((old) => (hardRefresh ? newItems : [...old, ...newItems]))
      setNextToken(result?.data?.nextToken)
    } catch (err) {
      console.log(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSolverJob()
    fetchDeliveryJobs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solverJobId])

  useEffect(() => {
    if (selectedDeliveryJobs?.segments) {
      setSelectedDeliverySegment(selectedDeliveryJobs.segments)
    } else {
      setSelectedDeliverySegment([])
    }
  }, [selectedDeliveryJobs])

  return (
    <Container>
      <Grid gridDefinition={[{ colspan: 6 }, { colspan: 6 }]}>
        <SpaceBetween size='l'>
          <Table
            header={
              <Header
                counter={`(${deliveryJobs.length})`}
                actions={
                  <SpaceBetween direction='horizontal' size='xs'>
                    <Button iconName='refresh' onClick={() => fetchDeliveryJobs(undefined, true)} ariaLabel='Refresh' />
                    {nextToken && (
                      <Button onClick={() => fetchDeliveryJobs(nextToken)} loading={loading}>
                        Load more
                      </Button>
                    )}
                  </SpaceBetween>
                }
              >
                Vehicles
              </Header>
            }
            columnDefinitions={columnDefinitions}
            items={deliveryJobs}
            loading={loading}
            loadingText='Loading delivery jobs'
            selectionType='single'
            selectedItems={selectedDeliveryJobs ? [selectedDeliveryJobs] : []}
            onSelectionChange={({ detail }) => {
              setSelectedDeliveryJobs(detail.selectedItems[0] ?? null)
            }}
            trackBy='Id'
            empty='No delivery jobs'
          />
        </SpaceBetween>

        <SpaceBetween size='l'>
          <Table
            header={<Header counter={`(${selectedDeliverySegment.length})`}>Assigned orders for selected vehicle</Header>}
            columnDefinitions={columnDefinitionsSegments}
            items={selectedDeliverySegment}
            loading={loading}
            loadingText='Loading segments'
            variant='embedded'
            empty='Select a vehicle to see segments'
          />
          <NextDayDeliveryMapComponent
            segments={selectedDeliveryJobs ? selectedDeliveryJobs.segments : undefined}
            route={selectedDeliveryJobs ? selectedDeliveryJobs.route : undefined}
          />
        </SpaceBetween>
      </Grid>
    </Container>
  )
}
