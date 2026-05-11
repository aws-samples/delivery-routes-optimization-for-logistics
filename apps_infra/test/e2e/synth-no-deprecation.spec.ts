import { spawnSync } from 'node:child_process'
import * as path from 'node:path'

describe('Property 10: Zero deprecation warnings on synth', () => {
  /**
   * **Validates: Requirements 13.5, 14.2, 14.3, 15.6**
   * pnpm synth produces no deprecation warnings and exits 0.
   */
  it('pnpm synth produces no deprecation warnings and exits 0', () => {
    const result = spawnSync('pnpm', ['synth'], {
      cwd: path.resolve(__dirname, '..', '..'),
      env: { ...process.env, AWS_PROFILE: 'ws', AWS_REGION: 'us-east-1' },
      encoding: 'utf8',
      timeout: 180_000,
    })

    expect(result.status).toBe(0)

    const output = (result.stdout ?? '') + (result.stderr ?? '')
    // Filter out Docker build output which may contain unrelated "deprecat" strings
    const lines = output.split('\n').filter(
      (line) =>
        !line.includes('DEPRECATED') && // Docker DEPRECATED instructions
        !line.includes('docker') &&
        !line.includes('buildx'),
    )
    const cdkOutput = lines.join('\n')
    const deprecationMatches = cdkOutput.match(/\bdeprecated?\b/gi) ?? []
    expect(deprecationMatches).toHaveLength(0)
  }, 180_000)
})
