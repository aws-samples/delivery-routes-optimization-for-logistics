/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */
import type { APIGatewayProxyHandler } from 'aws-lambda'
import { GetCommand, PutCommand, DeleteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb'
import { randomUUID } from 'node:crypto'
import { ddb } from '../../_shared/ddb'
import { json } from '../../_shared/response'

const TABLE = process.env.TABLE_NAME!

export const handler: APIGatewayProxyHandler = async (event) => {
  const method = event.httpMethod
  const id = event.pathParameters?.warehouseId

  try {
    if (method === 'GET' && id) {
      const r = await ddb.send(new GetCommand({ TableName: TABLE, Key: { Id: id } }))
      return json(r.Item ? 200 : 404, { data: { Item: r.Item ?? null } })
    }
    if (method === 'GET') {
      const r = await ddb.send(new ScanCommand({ TableName: TABLE, Limit: 100 }))
      return json(200, { data: { Items: r.Items ?? [] } })
    }
    if (method === 'POST') {
      const item = { Id: randomUUID(), ...JSON.parse(event.body ?? '{}') }
      await ddb.send(new PutCommand({ TableName: TABLE, Item: item }))
      return json(201, { data: { Item: item } })
    }
    if (method === 'PUT' && id) {
      const item = { Id: id, ...JSON.parse(event.body ?? '{}') }
      await ddb.send(new PutCommand({ TableName: TABLE, Item: item }))
      return json(200, { data: { Item: item } })
    }
    if (method === 'DELETE' && id) {
      await ddb.send(new DeleteCommand({ TableName: TABLE, Key: { Id: id } }))
      return json(204, {})
    }
    return json(405, { message: 'method not allowed' })
  } catch (err) {
    console.error(err)
    return json(500, { message: 'internal error' })
  }
}
