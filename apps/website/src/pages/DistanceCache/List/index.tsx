/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { Button, Inline, Table, ButtonIcon, Modal, Stack, Box, FormField, Input } from 'aws-northstar'
import { FunctionComponent, useState } from 'react'
import { useHistory } from 'react-router-dom'
import { useDistanceCacheContext } from '../../../contexts/DistanceCacheContext'
import { columnDefinitions } from './table-columns'
import { appvars } from '../../../config'
import NextDayDelivery from '../../../api/NextDayDelivery'

export const List: FunctionComponent = () => {
  const history = useHistory()
  const [{ items: distCacheItems, isLoading }, { refreshItems }] = useDistanceCacheContext()

  const onRefreshClick = async () => {
    refreshItems()
  }

  const [modalBuildDistCache, setModalBuildDistCache] = useState(false)
  const [modalResultDistCache, setModalResultDistCache] = useState(false)
  const [reqWarehouseCode, setReqWarehouseCoe] = useState('')

  const buildDistanceCache = async () => {
    setModalBuildDistCache(false)
    try {
      const result = await NextDayDelivery.buildDistanceCache(reqWarehouseCode)
      setModalResultDistCache(true)
      console.log(result)
    } catch (e) {
      console.log(e)
    }
  }

  const tableActions = (
    <Inline>
      <Button onClick={onRefreshClick}>
        <ButtonIcon type='refresh' />
      </Button>
      <Button onClick={() => setModalBuildDistCache(true)} variant='normal'>
        Rebuild DistanceCache
      </Button>
    </Inline>
  )

  return (
    <>
      <Modal title='Rebuild Distance Cache' visible={modalBuildDistCache} onClose={() => setModalBuildDistCache(false)}>
        <FormField label={'Warehouse Code'} controlId='ctlWarehouseCode'>
          <Input type='text' placeholder={'Warehouse Code'} onChange={setReqWarehouseCoe} />
        </FormField>
        <Box display='flex' width='100%' justifyContent='flex-end'>
          <Inline>
            <Button onClick={() => setModalBuildDistCache(false)}>Cancel</Button>
            <Button onClick={buildDistanceCache} variant='primary'>
              ReBuild
            </Button>
          </Inline>
        </Box>
      </Modal>
      <Modal
        title='Rebuild Distance Cache'
        visible={modalResultDistCache}
        onClose={() => setModalResultDistCache(false)}
      >
        <Stack>Distance cache rebuild job is requested.</Stack>
        <Box display='flex' width='100%' justifyContent='flex-end'>
          <Inline>
            <Button onClick={() => setModalResultDistCache(false)}>Close</Button>
          </Inline>
        </Box>
      </Modal>
      <Table
        tableTitle={'DistanceCache List'}
        columnDefinitions={columnDefinitions}
        items={distCacheItems}
        loading={isLoading}
        actionGroup={tableActions}
        multiSelect={false}
        disableRowSelect={true}
        defaultPageSize={25}
        sortBy={[{ id: 'createdAt', desc: true }]}
        pageSizes={[25, 50, 100]}
        rowCount={distCacheItems.length}
      />
    </>
  )
}
