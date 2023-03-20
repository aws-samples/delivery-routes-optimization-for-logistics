/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

module.exports = {
  extends: ['../../packages/@config/eslint', 'plugin:react-hooks/recommended'],
  root: true,
  plugins: ['import'],
  rules: {
    // turn on errors for missing imports
    'import/no-unresolved': 'error',
    '@typescript-eslint/no-unused-vars': 'off',
    'no-console': 0,
  },
  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
    'import/resolver': {
      // use <root>/tsconfig.json
      typescript: {
        alwaysTryTypes: true, // always try to resolve types under `<root>@types` directory even it doesn't contain any source code, like `@types/unist`
      },
    },
  },
}
