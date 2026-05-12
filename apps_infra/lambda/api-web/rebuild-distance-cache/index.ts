/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */
import type { APIGatewayProxyHandler } from 'aws-lambda'
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'
import { ECSClient, RunTaskCommand, DescribeClustersCommand } from '@aws-sdk/client-ecs'
import { EC2Client, DescribeSubnetsCommand } from '@aws-sdk/client-ec2'
import { json } from '../../_shared/response'

const ssm = new SSMClient({})
const ecs = new ECSClient({})
const ec2 = new EC2Client({})

const SSM_CLUSTER = process.env.SSM_CLUSTER!
const SSM_CAPACITY_PROVIDER = process.env.SSM_CAPACITY_PROVIDER!
const SSM_CONTAINER = process.env.SSM_CONTAINER!
const SSM_TASK_DEF = process.env.SSM_TASK_DEF!
const SSM_BUCKET = process.env.SSM_BUCKET!
const SSM_LOC_TABLE = process.env.SSM_LOC_TABLE!
const SSM_CACHE_TABLE = process.env.SSM_CACHE_TABLE!
const SSM_VPC_ID = process.env.SSM_VPC_ID!

async function getParam(name: string): Promise<string> {
  const r = await ssm.send(new GetParameterCommand({ Name: name }))
  return r.Parameter?.Value ?? ''
}

async function getPrivateSubnets(vpcId: string): Promise<string[]> {
  const r = await ec2.send(
    new DescribeSubnetsCommand({
      Filters: [
        { Name: 'vpc-id', Values: [vpcId] },
        { Name: 'map-public-ip-on-launch', Values: ['false'] },
      ],
    }),
  )
  return (r.Subnets ?? []).map((s) => s.SubnetId!).filter(Boolean)
}

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const warehouseCode = event.pathParameters?.warehouseCode ?? ''

    const [cluster, container, taskDef, bucket, locTable, cacheTable, vpcId] = await Promise.all([
      getParam(SSM_CLUSTER),
      getParam(SSM_CONTAINER),
      getParam(SSM_TASK_DEF),
      getParam(SSM_BUCKET),
      getParam(SSM_LOC_TABLE),
      getParam(SSM_CACHE_TABLE),
      getParam(SSM_VPC_ID),
    ])

    const subnets = await getPrivateSubnets(vpcId)

    const result = await ecs.send(
      new RunTaskCommand({
        cluster,
        taskDefinition: taskDef,
        launchType: 'FARGATE',
        networkConfiguration: {
          awsvpcConfiguration: {
            assignPublicIp: 'DISABLED',
            subnets,
          },
        },
        overrides: {
          containerOverrides: [
            {
              name: container,
              environment: [
                { name: 'BUCKET_NAME', value: bucket },
                { name: 'LOCATION_TABLE', value: locTable },
                { name: 'CACHE_TABLE', value: cacheTable },
                { name: 'WAREHOUSE_CODE', value: warehouseCode },
              ],
            },
          ],
        },
      }),
    )

    return json(200, { data: { message: 'Task started', taskArns: result.tasks?.map((t) => t.taskArn) } })
  } catch (err) {
    console.error(err)
    return json(500, { message: 'internal error' })
  }
}
