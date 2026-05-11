/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */
import type { APIGatewayProxyHandler } from 'aws-lambda'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { randomUUID } from 'node:crypto'
import { json } from '../../_shared/response'
import { requireEnv } from '../../_shared/env'

const s3 = new S3Client({})
const BUCKET_NAME = requireEnv('BUCKET_NAME')

export const handler: APIGatewayProxyHandler = async () => {
  try {
    const key = `uploads/${randomUUID()}.json`
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: 'application/json',
    })

    const url = await getSignedUrl(s3, command, { expiresIn: 3600 })

    return json(200, { url })
  } catch (err) {
    console.error('Error generating presigned URL', err)
    return json(500, { message: 'Internal server error' })
  }
}
