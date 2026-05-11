/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

export {}

declare global {
  // Populated at runtime by /static/appvars.js before the React bundle loads.
  // eslint-disable-next-line no-var
  var appVariables: Record<string, unknown>
  type IdType = string | number
}
