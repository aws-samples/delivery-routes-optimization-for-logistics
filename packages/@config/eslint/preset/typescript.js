/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

module.exports = {
  extends: ['./standard', 'plugin:@typescript-eslint/recommended', 'prettier', 'plugin:import/typescript'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
      impliedStrict: true,
    },
    typescript: true,
  },
  env: {
    node: true,
    es6: true,
    'jest/globals': true,
  },
  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
    'import/resolver': {
      typescript: {
        // directory: [
        // 	'./packages/**/tsconfig.json',
        // 	'./tsconfig.json',
        // ],
      },
    },
    'function-paren-newline': ['error', 'never'],
  },
  plugins: ['@typescript-eslint'],
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      parser: '@typescript-eslint/parser',
      rules: {
        // eslint-disable-next-line max-len
        // https://github.com/typescript-eslint/typescript-eslint/blob/61c60dc047da680b8cc74943c52c33562942c95a/packages/eslint-plugin/src/configs/recommended.json
        '@typescript-eslint/adjacent-overload-signatures': 'error',
        '@typescript-eslint/array-type': 'error',
        '@typescript-eslint/ban-types': 'warn',
        '@typescript-eslint/ban-ts-comment': 'warn',
        '@typescript-eslint/explicit-function-return-type': 'warn',
        '@typescript-eslint/explicit-member-accessibility': 'off',
        '@typescript-eslint/member-delimiter-style': [
          'error',
          {
            multiline: {
              delimiter: 'none',
              requireLast: true,
            },
            // singleline: {
            //   delimiter: 'none',
            //   requireLast: true,
            // },
          },
        ],
        '@typescript-eslint/no-array-constructor': 'error',
        '@typescript-eslint/no-empty-interface': 'warn',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-inferrable-types': 'error',
        '@typescript-eslint/no-misused-new': 'error',
        '@typescript-eslint/no-namespace': 'error',
        '@typescript-eslint/no-non-null-assertion': 'error',
        '@typescript-eslint/no-parameter-properties': 'off',
        '@typescript-eslint/no-unused-vars': ['warn'],
        '@typescript-eslint/no-use-before-define': [
          'error',
          {
            // `functions` and `typedefs` are hoisted and therefore safe
            functions: false,
            classes: true,
            variables: true,
            typedefs: false,
          },
        ],
        '@typescript-eslint/no-var-requires': 'error',
        '@typescript-eslint/prefer-namespace-keyword': 'error',
        '@typescript-eslint/type-annotation-spacing': 'error',
        'no-use-before-define': 'off',
      },
    },
    {
      files: ['**/package.json'],
      rules: {
        indent: 'off',
      },
    },
    {
      files: ['**/*.ts', '**/*.tsx'],
      parser: '@typescript-eslint/parser',
      rules: {
        camelcase: 'off',
        'no-array-constructor': 'off',
        'no-unused-vars': 'off',
        'no-useless-constructor': 'off',
        'no-use-before-define': 'off',
        '@typescript-eslint/no-useless-constructor': ['warn'],
      },
    },
    {
      files: ['**/*.js', '**/*.jsx'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/no-use-before-define': 'off',
      },
    },
    {
      files: ['**/@lambda/**/*.js'],
      rules: {
        'import/no-absolute-path': 'off',
      },
    },
    {
      files: ['**/*.tsx'],
      rules: {
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/explicit-member-accessibility': 'off',
        '@typescript-eslint/no-non-null-assertion': 'warn',
        '@typescript-eslint/no-namespace': 'warn',
      },
    },
    {
      files: ['**/*.spec.*', 'test/**/*'],
      rules: {
        '@typescript-eslint/explicit-function-return-type': 'off',
      },
    },
    {
      files: ['**/*.{test,spec,story}.ts{,x}'],
      rules: {
        'import/no-extraneous-dependencies': ['error'],
      },
    },
  ],
}
