/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

/* eslint-disable no-console */
const aws = require('aws-sdk')
const { success, fail } = require('/opt/lambda-utils')

const s3 = new aws.S3()

const BUCKET_NAME = process.env.BUCKET_NAME

const handler = async (event) => {
  if (event.body === undefined) {
    console.error(` :: getS3PresignedUrl :: POST :: 'body' not found in event object: ${JSON.stringify(event)}`)

    return fail({ error: 'Unrecognized message format' })
  }

  // check body
  let { body } = event

  if (typeof body === 'string' || body instanceof String) {
    body = JSON.parse(body)
  }

  console.log(`:: getS3PresignedUrl :: POST :: body :: ${JSON.stringify(body)}`)

  let { keyPath, operation } = body

  if (operation == null) {
    operation = 'putObject'
  }

  try {
    switch (operation) {
      case 'putObject': {
        const data = await new Promise((resolve, reject) => {
          s3.createPresignedPost(
            {
              Bucket: BUCKET_NAME,
              Fields: {
                key: keyPath,
              },
              Conditions: [['eq', '$Content-Type', 'text/csv']],
              Expires: 300, // 5 minutes
            },
            (err, data) => {
              if (err) {
                reject(err)
              } else {
                resolve(data)
              }
            },
          )
        })

        return success(data)
      }

      case 'getObject': {
        const presignedUrl = s3.getSignedUrl(operation, {
          Bucket: BUCKET_NAME,
          Key: keyPath,
          Expires: 300, // 5 minutes
        })

        return success(presignedUrl)
      }
      default:
        return fail({ message: `${operation} operation not supported.` })
    }
  } catch (err) {
    console.error('Error while getting presigned URL', err)

    return fail(err)
  }
}

exports.handler = handler
