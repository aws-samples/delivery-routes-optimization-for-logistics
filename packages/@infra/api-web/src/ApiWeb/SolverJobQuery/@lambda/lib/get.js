/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

/* eslint-disable no-console */
const aws = require('aws-sdk')
const { success, fail } = require('/opt/lambda-utils')

const DDB_TABLE = process.env.DDB_TABLE
const NAME = process.env.MANAGER_NAME

const ddbClient = new aws.DynamoDB.DocumentClient()

const handler = async (event) => {
  const entityId = event.pathParameters ? event.pathParameters[`${NAME}Id`] : undefined
  console.log(`:: ${NAME}-manager :: GET :: ${NAME}Id = ${entityId}`)

  try {
    const params = {
      TableName: DDB_TABLE,
    }
    let result

    // list all
    if (entityId === undefined) {
      console.debug(`:: ${NAME}-manager :: GET :: retrieving all ${NAME}s :: ${JSON.stringify(params)}`)
      result = await ddbClient.scan(params).promise()
    } else {
      params.Key = {
        Id: entityId,
      }

      console.debug(`:: ${NAME}-manager :: retrieving ${NAME} :: ${JSON.stringify(params)}`)
      result = await ddbClient.get(params).promise()
    }

    console.debug(`:: ${NAME}-manager :: result :: ${JSON.stringify(result)}`)

    return success({ data: result })
  } catch (err) {
    console.error(`There was an error while retrieving ${NAME}s: ${JSON.stringify(err)}`)

    return fail({ error: err })
  }
}

exports.handleGET = handler
