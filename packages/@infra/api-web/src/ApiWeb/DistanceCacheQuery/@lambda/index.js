/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

const { fail } = require('/opt/lambda-utils')
const { handleGET } = require('./lib/get')

const handler = async (event) => {
  switch (event.httpMethod) {
    case 'GET':
      return handleGET(event)
    default: {
      fail({ error: `${event.httpMethod} not supported` })
    }
  }
}

exports.handler = handler
