/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

const aws = require('aws-sdk')

const success = (body) => {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(body),
  }
}

const fail = (err, statusCode) => {
  return {
    statusCode: statusCode || 500,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(err),
  }
}

exports.success = success
exports.fail = fail
