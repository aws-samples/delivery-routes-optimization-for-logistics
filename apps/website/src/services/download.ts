/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import API from '@aws-amplify/api'
import { appvars } from '../config'

const browserDL = (response: any): void => {
  const byteArray = Buffer.from(response.data, 'base64').valueOf()
  const blob = new Blob([byteArray], { type: 'application/octet-stream' })

  const filename = response.filename

  const blobURL = window.URL.createObjectURL(blob)
  const tempLink = document.createElement('a')
  tempLink.style.display = 'none'
  tempLink.href = blobURL
  tempLink.setAttribute('download', filename)

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
    const response = await API.get(appvars.BACKENDVARS.API_DS_NAME, `/dl/${type}.${value}`, {
      Headers: {
        // Accept: 'text/csv, application/json',
      },
    })
    browserDL(response)
  } catch (err) {
    console.error('[api::download] Error while retrieving data', err)
    throw err
  }
}
