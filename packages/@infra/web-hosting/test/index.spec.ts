/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { WebsiteHosting, HostingDeployment, AppVariables } from '../src'

describe('@infra/web-hosting', () => {
  test('module exists - WebsiteHosting', () => {
    expect(WebsiteHosting).toBeDefined()
  })
  test('module exists - HostingDeployment', () => {
    expect(HostingDeployment).toBeDefined()
  })
  test('module exists - AppVariables', () => {
    expect(AppVariables).toBeDefined()
  })
})
