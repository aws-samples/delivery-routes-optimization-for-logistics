/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

const { fail } = require('/opt/lambda-utils')
const { handleGET } = require('./lib/get')
const { handlePOST } = require('./lib/create')
const { handlePUT } = require('./lib/update')
const { handleDELETE } = require('./lib/delete')

const handler = async (event) => {
  switch (event.httpMethod) {
    case 'GET':
      return handleGET(event)
    case 'POST':
      return handlePOST(event)
    case 'PUT':
      return handlePUT(event)
    case 'DELETE':
      return handleDELETE(event)
    default: {
      fail({ error: `${event.httpMethod} not supported` })
    }
  }
}

exports.handler = handler
