/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */
import type { APIGatewayProxyHandler } from 'aws-lambda'
import { GetCommand, ScanCommand } from '@aws-sdk/lib-dynamodb'
import { ddb } from '../../_shared/ddb'
import { json } from '../../_shared/response'

const TABLE = process.env.TABLE_NAME!

export const handler: APIGatewayProxyHandler = async (event) => {
  const method = event.httpMethod
  const id = event.pathParameters?.solverJobId

  try {
    if (method === 'GET' && id) {
      const r = await ddb.send(new GetCommand({ TableName: TABLE, Key: { Id: id } }))
      return json(r.Item ? 200 : 404, { data: { Item: r.Item ?? null } })
    }
    if (method === 'GET') {
      const r = await ddb.send(new ScanCommand({ TableName: TABLE, Limit: 100 }))
      return json(200, { data: { Items: r.Items ?? [] } })
    }
    return json(405, { message: 'method not allowed' })
  } catch (err) {
    console.error(err)
    return json(500, { message: 'internal error' })
  }
}
