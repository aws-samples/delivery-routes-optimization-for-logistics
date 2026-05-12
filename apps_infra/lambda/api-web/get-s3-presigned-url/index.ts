/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */
import type { APIGatewayProxyHandler } from 'aws-lambda'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { json } from '../../_shared/response'

const s3 = new S3Client({})
const BUCKET_NAME = process.env.BUCKET_NAME!

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const key = event.queryStringParameters?.key
    if (!key) {
      return json(400, { message: 'Missing "key" query parameter' })
    }

    const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key })
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 })

    return json(200, { url })
  } catch (err) {
    console.error(err)
    return json(500, { message: 'internal error' })
  }
}
