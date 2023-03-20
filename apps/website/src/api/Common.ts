/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { Auth, API } from 'aws-amplify'
import { appvars } from '../config'

const apiName = appvars.BACKENDVARS.API_DS_NAME

const commonRequest = async (path: string, action: string, rq: any): Promise<any> => {
  const session = await Auth.currentSession()
  const request = {
    ...rq,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `${session.getIdToken().getJwtToken()}`,
    },
    // 1 minute timeout
    timeout: 60000,
  }

  return (API as any)[action](apiName, path, request)
}

const commonGetRequest = async (path: string, queryStringParameters?: unknown): Promise<any> => {
  const request = {
    queryStringParameters,
  }

  return commonRequest(path, 'get', request)
}

const commonDeleteRequest = async (path: string, queryStringParameters?: unknown): Promise<any> => {
  const request = {
    queryStringParameters,
  }

  return commonRequest(path, 'del', request)
}

const commonPostRequest = async (path: string, body: unknown, queryStringParameters = undefined): Promise<any> => {
  const request = {
    body,
    queryStringParameters: undefined,
  }

  if (queryStringParameters) {
    request.queryStringParameters = queryStringParameters
  }

  return commonRequest(path, 'post', request)
}

const commonPutRequest = async (path: string, body: unknown, queryStringParameters = undefined): Promise<any> => {
  const request = {
    body,
    queryStringParameters: undefined,
  }

  if (queryStringParameters) {
    request.queryStringParameters = queryStringParameters
  }

  return commonRequest(path, 'put', request)
}

const commonPatchRequest = async (path: string, body: unknown, queryStringParameters = undefined): Promise<any> => {
  const request = {
    body,
    queryStringParameters: undefined,
  }

  if (queryStringParameters) {
    request.queryStringParameters = queryStringParameters
  }

  return commonRequest(path, 'patch', request)
}

export default {
  commonGetRequest,
  commonPostRequest,
  commonPutRequest,
  commonPatchRequest,
  commonDeleteRequest,
}
