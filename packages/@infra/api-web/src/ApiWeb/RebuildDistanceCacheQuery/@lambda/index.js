/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

/* eslint-disable no-console */
const AWS = require('aws-sdk')
const { success, fail } = require('/opt/lambda-utils')
const SsmClient = require('aws-sdk/clients/ssm')

const ssm = new SsmClient()
const ecs = new AWS.ECS()

const { AWS_REGION, KEY_LOC_TABLE_NAME, KEY_BUCKET_NAME, KEY_CACHE_TABLE_NAME, KEY_CLUSTER, KEY_CAPACITY_PROVIDER, KEY_TASK_DEF, KEY_CONTAINER } =
  process.env

exports.handler = async (event) => {
  const ssmRequest = ssm
    .getParameters({
      Names: [KEY_LOC_TABLE_NAME, KEY_BUCKET_NAME, KEY_CACHE_TABLE_NAME, KEY_CLUSTER, KEY_CAPACITY_PROVIDER, KEY_TASK_DEF, KEY_CONTAINER],
      WithDecryption: true,
    })
    .promise()
  const ssmRes = await ssmRequest

  const WAREHOUSE_CODE = event.pathParameters ? event.pathParameters[`warehouseCode`] : undefined
  console.log('WAREHOUSE_CODE - '+WAREHOUSE_CODE)
  if(!WAREHOUSE_CODE) {
    const errMsg = 'ERROR - Warehouse Code is not set'
    console.log(errMsg)
    return fail({error : errMsg, warehouse: WAREHOUSE_CODE})
  }

  const ssmParam = {}
  const containerEnv = { }
  ssmRes.Parameters.forEach((p) => {
    switch (p.Name) {
      case KEY_CLUSTER:
        ssmParam.cluster = p.Value
        break
      case KEY_CAPACITY_PROVIDER:
        ssmParam.capacityProvider = p.Value
        break
      case KEY_TASK_DEF:
        ssmParam.taskDefinition = p.Value
        break
      case KEY_CONTAINER:
        ssmParam.containerName = p.Value
        break
      case KEY_LOC_TABLE_NAME:
        containerEnv.LOC_TABLE_NAME = p.Value
        break
      case KEY_BUCKET_NAME:
        containerEnv.BUCKET_NAME = p.Value
        break
      case KEY_CACHE_TABLE_NAME:
        containerEnv.CACHE_TABLE_NAME = p.Value
        break
      default:
        console.log('WARN : Unexpected ssm params - ' + p.Name)
    }
  })

  const ecsParam = {
    cluster: ssmParam.cluster,
    count: 1,
    taskDefinition: ssmParam.taskDefinition,
    capacityProviderStrategy: [{ capacityProvider: ssmParam.capacityProvider }],
    overrides: {
      containerOverrides: [
        {
          name: ssmParam.containerName,
          command: [
            'java',
            '-jar',
            '-Daws.region=' + AWS_REGION,
            'distance-cache-util-jar-with-dependencies.jar',
            'build-lat-long',
            '--location=ddb',
            '--loctablename=' + containerEnv.LOC_TABLE_NAME,
            '--bucketname=' + containerEnv.BUCKET_NAME,
            '--tablename=' + containerEnv.CACHE_TABLE_NAME,
            '--warehouse=' + WAREHOUSE_CODE,
          ],
        },
      ],
    },
  }
  console.log(JSON.stringify(ecsParam))

  const ecsTaskRunRequest = ecs.runTask(ecsParam).promise()
  const result = await ecsTaskRunRequest
  console.log('-- task result --')
  console.log(result)

  return success( {result : 'run task requested', warehouse: WAREHOUSE_CODE} )
}
