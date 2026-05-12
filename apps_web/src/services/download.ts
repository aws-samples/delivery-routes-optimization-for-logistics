/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import common from '../api/Common'

interface DownloadResponse {
  data: string // base64
  filename: string
}

const browserDL = (response: DownloadResponse): void => {
  const binary = atob(response.data)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }

  const blob = new Blob([bytes], { type: 'application/octet-stream' })
  const blobURL = window.URL.createObjectURL(blob)
  const tempLink = document.createElement('a')
  tempLink.style.display = 'none'
  tempLink.href = blobURL
  tempLink.setAttribute('download', response.filename)

  // Safari thinks _blank anchor are pop ups. We only want to set _blank
  // target if the browser does not support the HTML5 download attribute.
  // This allows you to download files in desktop safari if pop up blocking
  // is enabled.
  if (typeof tempLink.download === 'undefined') {
    tempLink.setAttribute('target', '_blank')
  }

  document.body.appendChild(tempLink)
  tempLink.click()
  document.body.removeChild(tempLink)
  window.URL.revokeObjectURL(blobURL)
}

export const downloadFile = async (type: string, value: string): Promise<void> => {
  try {
    const response = (await common.commonGetRequest(`/dl/${type}.${value}`)) as DownloadResponse
    browserDL(response)
  } catch (err) {
    console.error('[api::download] Error while retrieving data', err)
    throw err
  }
}
