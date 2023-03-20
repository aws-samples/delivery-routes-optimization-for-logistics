/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

module.exports = {
  env: {
    node: true,
    browser: true,
    jest: true,
  },
  // https://eslint.org/docs/user-guide/configuring#specifying-parser-options
  parserOptions: {
    // https://eslint.org/docs/user-guide/migrating-to-5.0.0#experimental-object-rest-spread
    ecmaVersion: 2018,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
      impliedStrict: true,
    },
  },
  plugins: ['jest', 'json', 'lodash'],
  extends: [
    'eslint:recommended',
    'standard',
    'plugin:prettier/recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:jest/recommended',
  ],
  rules: {
    'no-tabs': 'off',
    indent: ['error', 'tab', { SwitchCase: 1, MemberExpression: 0 }],

    // Errors
    'brace-style': ['error', '1tbs', { allowSingleLine: false }],
    'comma-dangle': ['error', 'always-multiline'],
    curly: ['error', 'all'],
    'lines-between-class-members': ['error', 'always'],
    'no-trailing-spaces': ['error', { skipBlankLines: false }],
    'no-unused-vars': [
      'error',
      {
        varsIgnorePattern: '^(?:styles?)|(?:React)$',
        args: 'none',
        ignoreRestSiblings: true,
      },
    ],
    'padding-line-between-statements': [
      'error',
      { blankLine: 'always', prev: '*', next: 'class' },
      { blankLine: 'always', prev: '*', next: 'function' },
      { blankLine: 'always', prev: '*', next: 'if' },
      { blankLine: 'always', prev: '*', next: 'return' },
      { blankLine: 'always', prev: 'directive', next: '*' },
      { blankLine: 'any', prev: 'directive', next: 'directive' },
      { blankLine: 'always', prev: ['import', 'cjs-import'], next: '*' },
      {
        blankLine: 'never',
        prev: ['import', 'cjs-import'],
        next: ['import', 'cjs-import'],
      },
    ],
    'yield-star-spacing': ['error', 'after'],

    // Warnings
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'lodash/import-scope': ['warn', 'member'],
    'padded-blocks': 'warn',
    'generator-star-spacing': 'warn',
    'import/namespace': 'warn',
    'no-mixed-operators': 'warn',
    'max-len': [
      'warn',
      {
        code: 120,
        tabWidth: 1,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
        ignoreRegExpLiterals: true,
        ignoreComments: false,
        ignoreTrailingComments: true,
        ignorePattern: '^\\s*((export\\s(default\\s)?)?function)|(@(param|example|returns)\\s+)',
      },
    ],

    'import/no-named-as-default': 'off',
    'no-new': 'off',
  },
}
