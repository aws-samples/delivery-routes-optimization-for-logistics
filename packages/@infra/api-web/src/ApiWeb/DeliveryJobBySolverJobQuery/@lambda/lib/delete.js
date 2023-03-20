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
  console.log(` :: ${NAME}-manager :: DELETE :: ${NAME}Id = ${entityId}`)

  // no entityId parameter
  if (entityId === undefined) {
    console.error(` :: ${NAME}-manager :: DELETE :: ${NAME}Id not specified`)

    return fail({ error: `no ${NAME}Id set` })
  } else {
    const params = {
      TableName: DDB_TABLE,
      Key: {
        Id: entityId,
      },
    }

    try {
      const data = await ddbClient.delete(params).promise()

      console.log(` :: ${NAME}-manager :: DELETE :: ${NAME} (${entityId}) deleted successfully`)

      return success({ data })
    } catch (err) {
      console.error(
        `:: ${NAME}-manager :: DELETE :: There was an error while deleting ${NAME} with id ${entityId}: ${JSON.stringify(
          err,
        )}`,
      )

      return fail({ error: err })
    }
  }
}

exports.handleDELETE = handler
