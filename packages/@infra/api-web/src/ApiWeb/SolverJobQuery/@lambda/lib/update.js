/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

/* eslint-disable no-console */
const aws = require('aws-sdk')
const { success, fail } = require('/opt/lambda-utils')

const DDB_TABLE = process.env.DDB_TABLE
const NAME = process.env.MANAGER_NAME
const ASSET_BUCKET_NAME = process.env.ASSET_BUCKET_NAME
const ASSET_BUCKET_KEYPREFIX = process.env.ASSET_BUCKET_KEYPREFIX

const ddbClient = new aws.DynamoDB.DocumentClient()

const handler = async (event) => {
  if (event.body === undefined) {
    console.error(` :: ${NAME}-manager :: PUT :: 'body' not found in event object: ${JSON.stringify(event)}`)

    return fail({ error: 'Unrecognized message format' })
  }

  // check body
  let { body } = event

  if (typeof body === 'string' || body instanceof String) {
    body = JSON.parse(body)
  }

  console.log(`:: ${NAME}-manager :: PUT :: body :: ${JSON.stringify(body)}`)

  const putParams = {
    TableName: DDB_TABLE,
    Item: {
      ...body,
      updatedAt: Date.now(),
    },
  }

  try {
    console.debug(`:: ${NAME}-manager :: Updating ${NAME} record with params :: ${JSON.stringify(putParams)}`)
    await ddbClient.put(putParams).promise()

    const getParams = { TableName: DDB_TABLE, Key: { Id: body.Id } }
    console.debug(`:: ${NAME}-manager :: Retrieving ${NAME} record with params :: ${JSON.stringify(getParams)}`)

    const data = await ddbClient.get(getParams).promise()
    console.log(`:: ${NAME}-manager :: Successfully updated a ${NAME} object :: ${JSON.stringify(data)}`)

    return success({ data })
  } catch (err) {
    console.error(`:: ${NAME}-manager :: There was an error while updating a ${NAME} record: ${JSON.stringify(err)}`)

    return fail({ error: err })
  }
}

exports.handlePUT = handler
