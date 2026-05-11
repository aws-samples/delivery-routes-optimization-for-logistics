/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */
import type { S3Event } from 'aws-lambda'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, BatchWriteCommand } from '@aws-sdk/lib-dynamodb'
import { LambdaClient, InvokeCommand, InvocationType } from '@aws-sdk/client-lambda'
import { randomUUID } from 'node:crypto'
import { requireEnv } from '../../_shared/env'

const s3 = new S3Client({})
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}))
const lambda = new LambdaClient({})

const TABLE_NAME = requireEnv('TABLE_NAME')
const DISPATCH_LAMBDA_ARN = requireEnv('DISPATCH_LAMBDA_ARN')

export const handler = async (event: S3Event): Promise<void> => {
  for (const record of event.Records) {
    const bucket = record.s3.bucket.name
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '))

    // Get object from S3
    const getResponse = await s3.send(
      new GetObjectCommand({ Bucket: bucket, Key: key }),
    )
    const body = await getResponse.Body?.transformToString()
    if (!body) {
      console.warn(`Empty object: s3://${bucket}/${key}`)
      continue
    }

    // Support both JSON and CSV formats
    let orders: Record<string, unknown>[]
    const trimmed = body.trim()
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      // JSON format
      orders = JSON.parse(trimmed)
      if (!Array.isArray(orders)) orders = [orders]
    } else {
      // CSV format: first line is header, remaining lines are data
      const lines = trimmed.split('\n')
      const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''))
      // Fields that must remain as strings even if they look numeric
      const stringFields = new Set(['orderNo', 'orderDate', 'warehouseCode', 'deliveryCode'])
      orders = lines.slice(1).filter((line) => line.trim()).map((line) => {
        const values = line.match(/(".*?"|[^,]+)/g) ?? []
        const obj: Record<string, unknown> = {}
        headers.forEach((header, idx) => {
          const val = (values[idx] ?? '').trim().replace(/^"|"$/g, '')
          if (stringFields.has(header)) {
            obj[header] = val
          } else {
            // Convert numeric strings to numbers for DynamoDB Number type
            const num = Number(val)
            obj[header] = val !== '' && !isNaN(num) && !/^0\d/.test(val) ? num : val
          }
        })
        return obj
      })
    }

    console.log(`Parsed ${orders.length} orders from s3://${bucket}/${key}`)

    // Extract orderDate and warehouseCode from the first order
    const firstOrder = orders[0] ?? {}
    const orderDate = String(firstOrder.orderDate ?? firstOrder.ORDER_DATE ?? '')
    const warehouseCode = String(firstOrder.warehouseCode ?? firstOrder.WAREHOUSE_CODE ?? '')

    // Batch write to DynamoDB (max 25 items per batch)
    const BATCH_SIZE = 25
    for (let i = 0; i < orders.length; i += BATCH_SIZE) {
      const batch = orders.slice(i, i + BATCH_SIZE)
      const putRequests = batch.map((order) => ({
        PutRequest: {
          Item: {
            Id: randomUUID(),
            ...order,
            createdAt: new Date().toISOString(),
          },
        },
      }))

      await ddb.send(
        new BatchWriteCommand({
          RequestItems: {
            [TABLE_NAME]: putRequests,
          },
        }),
      )
    }

    // Invoke dispatch Lambda asynchronously
    await lambda.send(
      new InvokeCommand({
        FunctionName: DISPATCH_LAMBDA_ARN,
        InvocationType: InvocationType.Event,
        Payload: Buffer.from(JSON.stringify({ bucket, key, orderCount: orders.length, orderDate, warehouseCode })),
      }),
    )
  }
}
