/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { get, post, put, del } from 'aws-amplify/api'
import { appvars } from '../config'
import { getAuthHeaders } from '../services/base/amplify'

const apiName = appvars.BACKENDVARS.API_DS_NAME

type QueryParams = Record<string, string> | undefined

const toQueryParams = (value: unknown): QueryParams => {
  if (value == null) {
    return undefined
  }
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => [k, String(v)] as const)
  return entries.length ? Object.fromEntries(entries) : undefined
}

const parseResponse = async (bodyReader: {
  json: () => Promise<unknown>
  text: () => Promise<string>
}): Promise<any> => {
  try {
    return await bodyReader.json()
  } catch {
    return await bodyReader.text()
  }
}

const commonGetRequest = async (path: string, queryStringParameters?: unknown): Promise<any> => {
  const headers = await getAuthHeaders()
  const { response } = get({
    apiName,
    path,
    options: {
      headers,
      queryParams: toQueryParams(queryStringParameters),
    },
  })
  const { body } = await response
  return parseResponse(body)
}

const commonDeleteRequest = async (path: string, queryStringParameters?: unknown): Promise<any> => {
  const headers = await getAuthHeaders()
  const { response } = del({
    apiName,
    path,
    options: {
      headers,
      queryParams: toQueryParams(queryStringParameters),
    },
  })
  const { body } = await response
  return parseResponse(body)
}

const commonPostRequest = async (path: string, body: unknown, queryStringParameters?: unknown): Promise<any> => {
  const headers = await getAuthHeaders()
  const { response } = post({
    apiName,
    path,
    options: {
      headers,
      body: body as any,
      queryParams: toQueryParams(queryStringParameters),
    },
  })
  const { body: respBody } = await response
  return parseResponse(respBody)
}

const commonPutRequest = async (path: string, body: unknown, queryStringParameters?: unknown): Promise<any> => {
  const headers = await getAuthHeaders()
  const { response } = put({
    apiName,
    path,
    options: {
      headers,
      body: body as any,
      queryParams: toQueryParams(queryStringParameters),
    },
  })
  const { body: respBody } = await response
  return parseResponse(respBody)
}

// NOTE: Amplify v6 REST API does not expose a direct PATCH primitive.
// The legacy call-site for `commonPatchRequest` is unused in src, but we keep the
// signature to preserve backwards compat by delegating to `post` with `x-http-method-override`.
const commonPatchRequest = async (path: string, body: unknown, queryStringParameters?: unknown): Promise<any> => {
  const headers = await getAuthHeaders()
  const { response } = post({
    apiName,
    path,
    options: {
      headers: { ...headers, 'x-http-method-override': 'PATCH' },
      body: body as any,
      queryParams: toQueryParams(queryStringParameters),
    },
  })
  const { body: respBody } = await response
  return parseResponse(respBody)
}

export default {
  commonGetRequest,
  commonPostRequest,
  commonPutRequest,
  commonPatchRequest,
  commonDeleteRequest,
}
