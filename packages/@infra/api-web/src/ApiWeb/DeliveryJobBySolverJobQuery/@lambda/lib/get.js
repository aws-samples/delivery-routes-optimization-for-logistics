/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

/* eslint-disable no-console */
const aws = require('aws-sdk')
// const { filter } = require('lodash')
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
      FilterExpression: '#sid = :attr_val',
      ExpressionAttributeNames: {
        '#sid': 'solverJobId',
      },
      ExpressionAttributeValues: { ':attr_val': entityId },
    }

    // list all
    console.debug(`:: ${NAME}-manager :: GET :: retrieving all ${NAME}s :: ${JSON.stringify(params)}`)
    const scanResults = []
    let items
    do {
      items = await ddbClient.scan(params).promise()
      items.Items.forEach((item) => scanResults.push(item))
      params.ExclusiveStartKey = items.LastEvaluatedKey
    } while (typeof items.LastEvaluatedKey !== 'undefined')

    // console.debug(`:: ${NAME}-manager :: result :: ${JSON.stringify(result)}`)

    return success({ data: { Items: scanResults } })
  } catch (err) {
    console.error(`There was an error while retrieving ${NAME}s: ${JSON.stringify(err)}`)

    return fail({ error: err })
  }
}

exports.handleGET = handler
