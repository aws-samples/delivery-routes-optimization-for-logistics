/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */
import type { APIGatewayProxyHandler } from 'aws-lambda'
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'
import { ECSClient, RunTaskCommand } from '@aws-sdk/client-ecs'
import { EC2Client, DescribeSubnetsCommand } from '@aws-sdk/client-ec2'
import { json } from '../../_shared/response'
import { requireEnv } from '../../_shared/env'

const ssm = new SSMClient({})
const ecs = new ECSClient({})
const ec2 = new EC2Client({})

const SSM_CLUSTER = requireEnv('SSM_CLUSTER')
const SSM_CONTAINER = requireEnv('SSM_CONTAINER')
const SSM_TASK_DEF = requireEnv('SSM_TASK_DEF')
const SSM_VPC_ID = requireEnv('SSM_VPC_ID')

async function getParam(name: string): Promise<string> {
  const result = await ssm.send(new GetParameterCommand({ Name: name }))
  return result.Parameter?.Value ?? ''
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
    // Support both API Gateway (body) and Lambda invoke (direct event) calls
    let orderDate = ''
    let warehouseCode = ''

    if (event.body) {
      // Called via API Gateway
      const body = JSON.parse(event.body)
      orderDate = body.orderDate ?? ''
      warehouseCode = body.warehouseCode ?? ''
    } else {
      // Called via Lambda invoke (from create-order-batch)
      const payload = event as unknown as Record<string, string>
      orderDate = payload.orderDate ?? ''
      warehouseCode = payload.warehouseCode ?? ''
    }

    const [cluster, container, taskDef, vpcId] = await Promise.all([
      getParam(SSM_CLUSTER),
      getParam(SSM_CONTAINER),
      getParam(SSM_TASK_DEF),
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
                { name: 'ORDER_DATE', value: orderDate },
                { name: 'WAREHOUSE_CODE', value: warehouseCode },
              ],
            },
          ],
        },
      }),
    )

    return json(200, {
      data: { message: 'Order dispatch task started', taskArn: result.tasks?.[0]?.taskArn },
    })
  } catch (err) {
    console.error('Error starting order dispatch task', err)
    return json(500, { message: 'Internal server error' })
  }
}
