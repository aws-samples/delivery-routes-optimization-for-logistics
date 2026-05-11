/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */
import * as fs from 'node:fs'
import * as path from 'node:path'

/**
 * **Property 9: No forbidden dependencies**
 * **Validates: Requirements 1.4, 3.11**
 *
 * Verifies that no dependency in `dependencies` or `devDependencies`
 * matches the forbidden pattern:
 *   /^(@aws-samples\/|@infra\/|@config\/|lerna$|yarn$|config$|find-up$|cdk-constants$|http-method-enum$)/
 */
describe('Property 9: No forbidden dependencies', () => {
  const FORBIDDEN_PATTERN =
    /^(@aws-samples\/|@infra\/|@config\/|lerna$|yarn$|config$|find-up$|cdk-constants$|http-method-enum$)/

  const pkgPath = path.resolve(__dirname, '..', '..', 'package.json')
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))

  const dependencies = Object.keys(pkg.dependencies ?? {})
  const devDependencies = Object.keys(pkg.devDependencies ?? {})
  const allDeps = [...dependencies, ...devDependencies]

  it('should have a readable package.json', () => {
    expect(pkg).toBeDefined()
    expect(pkg.name).toBe('apps-infra')
  })

  it('should not contain any forbidden dependency in dependencies', () => {
    const forbidden = dependencies.filter((dep) => FORBIDDEN_PATTERN.test(dep))
    expect(forbidden).toEqual([])
  })

  it('should not contain any forbidden dependency in devDependencies', () => {
    const forbidden = devDependencies.filter((dep) => FORBIDDEN_PATTERN.test(dep))
    expect(forbidden).toEqual([])
  })

  it('should not contain any forbidden dependency across all dependency fields', () => {
    const forbidden = allDeps.filter((dep) => FORBIDDEN_PATTERN.test(dep))
    expect(forbidden).toEqual([])
  })

  // Verify each forbidden pattern individually for clarity
  const forbiddenExamples = [
    '@aws-samples/some-package',
    '@infra/common',
    '@infra/networking',
    '@config/eslint',
    'lerna',
    'yarn',
    'config',
    'find-up',
    'cdk-constants',
    'http-method-enum',
  ]

  it.each(forbiddenExamples)(
    'should not list "%s" as a dependency',
    (forbiddenDep) => {
      expect(allDeps).not.toContain(forbiddenDep)
    },
  )
})
