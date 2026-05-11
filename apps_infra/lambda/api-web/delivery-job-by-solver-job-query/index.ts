/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */
import type { APIGatewayProxyHandler } from 'aws-lambda'
import { QueryCommand } from '@aws-sdk/lib-dynamodb'
import { ddb } from '../../_shared/ddb'
import { json } from '../../_shared/response'

const TABLE = process.env.TABLE_NAME!
const INDEX_NAME = process.env.INDEX_NAME!

export const handler: APIGatewayProxyHandler = async (event) => {
  const method = event.httpMethod
  const id = event.pathParameters?.deliveryJobBySolverJobId

  try {
    if (method === 'GET' && id) {
      const r = await ddb.send(
        new QueryCommand({
          TableName: TABLE,
          IndexName: INDEX_NAME,
          KeyConditionExpression: 'solverJobId = :sjId',
          ExpressionAttributeValues: { ':sjId': id },
        }),
      )
      return json(200, { data: { Items: r.Items ?? [] } })
    }
    if (method === 'GET') {
      const r = await ddb.send(
        new QueryCommand({
          TableName: TABLE,
          IndexName: INDEX_NAME,
          KeyConditionExpression: 'solverJobId = :sjId',
          ExpressionAttributeValues: { ':sjId': '' },
        }),
      )
      return json(200, { data: { Items: r.Items ?? [] } })
    }
    return json(405, { message: 'method not allowed' })
  } catch (err) {
    console.error(err)
    return json(500, { message: 'internal error' })
  }
}
