/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

const path = require('path')

module.exports = {
  clearMocks: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'clover'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  globals: {
    'ts-jest': {
      extends: '../types/tsconfig.json',
    },
  },
  moduleFileExtensions: ['ts', 'tsx', 'js'],
  modulePathIgnorePatterns: ['dist'],
  moduleNameMapper: {
    '(@config(.+))$': [path.join(__dirname, 'packages/@config/$1/src'), '$1'],
    '(@infra(.+))$': [path.join(__dirname, 'packages/@infra/$1/src'), '$1'],
  },
  notify: true,
  notifyMode: 'always',
  roots: ['<rootDir>'],
  testMatch: ['**/__tests__/*.+(ts|tsx|js)', '**/*.(test|spec).+(ts|tsx|js)'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  setupFilesAfterEnv: [path.join(__dirname, 'setupTests.ts')],
}
