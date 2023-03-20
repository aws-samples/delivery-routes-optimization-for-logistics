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

const { AWS_REGION, KEY_CLUSTER, KEY_CAPACITY_PROVIDER, KEY_TASK_DEF, KEY_CONTAINER } = process.env

exports.handler = async (event) => {
  const { warehouseCode, orderDate } = event

  const ssmRequest = ssm
    .getParameters({
      Names: [KEY_CLUSTER, KEY_CAPACITY_PROVIDER, KEY_TASK_DEF, KEY_CONTAINER],
      WithDecryption: true,
    })
    .promise()
  const ssmRes = await ssmRequest

  const ssmParam = {}
  const containerEnv = {}
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
            '-Dorder-date=' + orderDate,
            '-Dwarehouse-code=' + warehouseCode,
            'delivery-dispatch-runner.jar',
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

  return result
}
