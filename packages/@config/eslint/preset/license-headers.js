/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

const path = require('path')

module.exports = {
  plugins: ['license-header'],
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
      parser: '@typescript-eslint/parser',
      rules: {
        'license-header/header': ['error', path.join(__dirname, '..', 'license-headers', 'header.js')],
        'prettier/prettier' : ['error', {"endOfLine" : "auto"}]
      },
    },
  ],
}
