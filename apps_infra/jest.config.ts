import type { Config } from 'jest'

const config: Config = {
  testEnvironment: 'node',
  preset: 'ts-jest',
  testMatch: ['<rootDir>/test/**/*.spec.ts'],
  collectCoverageFrom: ['src/**/*.ts'],
  transform: { '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.json' }] },
  moduleFileExtensions: ['ts', 'js'],
  clearMocks: true,
  coverageProvider: 'v8',
}

export default config
