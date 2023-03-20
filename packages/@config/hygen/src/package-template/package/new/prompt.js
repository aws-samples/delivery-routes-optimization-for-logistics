/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

const { createPackagePrompt } = require('@config/hygen')

module.exports = createPackagePrompt({
  scope: '@infra',
  license: 'Apache-2.0',
  prefix: false,
  defaults: {
    version: '0.0.0-alpha.0',
    homepage: '',
    repository: '',
    emailDomain: '',
  },
})
