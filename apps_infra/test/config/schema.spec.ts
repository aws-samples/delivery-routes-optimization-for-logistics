import { stringify as yamlStringify, parse as yamlParse } from 'yaml'
import { ZodError } from 'zod'
import { RootConfigSchema } from '../../src/config/schema'
import { loadConfig } from '../../src/config/loader'
import * as path from 'node:path'
import * as fs from 'node:fs'

/**
 * Property 1: Config schema round-trip validity
 * Validates: Requirements 2.2, 2.3, 2.4, 2.5
 *
 * A valid config object serialized to YAML and parsed back should re-validate identically.
 */
describe('Property 1: Config schema round-trip validity', () => {
  const validSample = {
    env: { account: '123456789012', region: 'us-east-1' },
    namespace: 'testns',
    administratorEmail: 'admin@example.com',
    administratorName: 'Admin',
    fargateOptions: {
      distCacheCpu: 4096,
      distCacheMemory: 8192,
      distCacheArchitecture: 'arm64' as const,
      optEngineCpu: 4096,
      optEngineMemory: 8192,
      optEngineArchitecture: 'arm64' as const,
    },
    parameterStoreKeys: {
      commonVpcId: '/Test/VPC/Id',
      tableName: '/Test/DDB/Table',
    },
    assets: {
      websiteBundlePath: '../apps_web/dist',
      distanceCacheDockerPath: '../apps_opt_engine/build/distancecache-util',
      optEngineDockerPath: '../apps_opt_engine/build/nextday-delivery',
    },
  }

  it('round-trips through YAML stringify → parse → re-validate', () => {
    const parsed = RootConfigSchema.parse(validSample)
    const yamlStr = yamlStringify(parsed)
    const reparsedRaw = yamlParse(yamlStr)
    const reparsed = RootConfigSchema.parse(reparsedRaw)

    expect(reparsed).toEqual(parsed)
  })

  it('round-trips with minimal config (defaults applied)', () => {
    const minimal = {
      env: { account: '999888777666', region: 'ap-northeast-2' },
      namespace: 'minimal',
      administratorEmail: 'test@test.io',
      fargateOptions: {
        distCacheCpu: 2048,
        distCacheMemory: 4096,
        distCacheArchitecture: 'x86_64' as const,
        optEngineCpu: 2048,
        optEngineMemory: 4096,
        optEngineArchitecture: 'x86_64' as const,
      },
      parameterStoreKeys: { key1: '/Path/To/Key' },
      assets: {
        websiteBundlePath: '../apps_web/dist',
        distanceCacheDockerPath: '../apps_opt_engine/build/distancecache-util',
        optEngineDockerPath: '../apps_opt_engine/build/nextday-delivery',
      },
    }

    const parsed = RootConfigSchema.parse(minimal)
    const yamlStr = yamlStringify(parsed)
    const reparsedRaw = yamlParse(yamlStr)
    const reparsed = RootConfigSchema.parse(reparsedRaw)

    expect(reparsed).toEqual(parsed)
  })
})

/**
 * Property 2: Config schema rejects invalid inputs
 * Validates: Requirements 2.2, 2.3, 2.4, 2.5, 2.6, 2.12
 *
 * Invalid configurations must throw ZodError.
 */
describe('Property 2: Config schema rejects invalid inputs', () => {
  const baseValid = {
    env: { account: '123456789012', region: 'us-east-1' },
    namespace: 'testns',
    administratorEmail: 'admin@example.com',
    fargateOptions: {
      distCacheCpu: 4096,
      distCacheMemory: 8192,
      distCacheArchitecture: 'arm64',
      optEngineCpu: 4096,
      optEngineMemory: 8192,
      optEngineArchitecture: 'arm64',
    },
    parameterStoreKeys: { key1: '/Path/Key' },
    assets: {
      websiteBundlePath: '../apps_web/dist',
      distanceCacheDockerPath: '../apps_opt_engine/build/distancecache-util',
      optEngineDockerPath: '../apps_opt_engine/build/nextday-delivery',
    },
  }

  it('rejects account with 11 digits (must be exactly 12)', () => {
    const invalid = { ...baseValid, env: { account: '12345678901', region: 'us-east-1' } }
    expect(() => RootConfigSchema.parse(invalid)).toThrow(ZodError)
  })

  it('rejects account with 13 digits', () => {
    const invalid = { ...baseValid, env: { account: '1234567890123', region: 'us-east-1' } }
    expect(() => RootConfigSchema.parse(invalid)).toThrow(ZodError)
  })

  it('rejects account with non-numeric characters', () => {
    const invalid = { ...baseValid, env: { account: '12345678901a', region: 'us-east-1' } }
    expect(() => RootConfigSchema.parse(invalid)).toThrow(ZodError)
  })

  it('rejects empty parameterStoreKeys value', () => {
    const invalid = { ...baseValid, parameterStoreKeys: { key1: '' } }
    expect(() => RootConfigSchema.parse(invalid)).toThrow(ZodError)
  })

  it('rejects missing required field (namespace)', () => {
    const { namespace: _, ...noNamespace } = baseValid
    expect(() => RootConfigSchema.parse(noNamespace)).toThrow(ZodError)
  })

  it('rejects invalid email format', () => {
    const invalid = { ...baseValid, administratorEmail: 'not-an-email' }
    expect(() => RootConfigSchema.parse(invalid)).toThrow(ZodError)
  })

  it('rejects empty region', () => {
    const invalid = { ...baseValid, env: { account: '123456789012', region: '' } }
    expect(() => RootConfigSchema.parse(invalid)).toThrow(ZodError)
  })

  it('rejects invalid architecture enum value', () => {
    const invalid = {
      ...baseValid,
      fargateOptions: { ...baseValid.fargateOptions, distCacheArchitecture: 'mips64' },
    }
    expect(() => RootConfigSchema.parse(invalid)).toThrow(ZodError)
  })
})

/**
 * Additional: CDK_DEFAULT_ACCOUNT override and assets defaults
 * Validates: Requirements 2.6, 2.12
 */
describe('Config loader integration', () => {
  const originalEnv = process.env
  const fixtureDir = path.resolve(__dirname, '__fixtures__')
  const configDir = path.join(fixtureDir, 'config')
  const configFile = path.join(configDir, 'default.yml')

  beforeAll(() => {
    // Create a fixture config directory
    fs.mkdirSync(configDir, { recursive: true })
    fs.writeFileSync(
      configFile,
      yamlStringify({
        env: { account: '111222333444', region: 'us-west-2' },
        namespace: 'fixture',
        administratorEmail: 'fixture@test.com',
        fargateOptions: {
          distCacheCpu: 4096,
          distCacheMemory: 8192,
          distCacheArchitecture: 'arm64',
          optEngineCpu: 4096,
          optEngineMemory: 8192,
          optEngineArchitecture: 'arm64',
        },
        parameterStoreKeys: { testKey: '/Test/Key' },
        assets: {
          websiteBundlePath: '../apps_web/dist',
          distanceCacheDockerPath: '../apps_opt_engine/build/distancecache-util',
          optEngineDockerPath: '../apps_opt_engine/build/nextday-delivery',
        },
      }),
    )
  })

  afterAll(() => {
    fs.rmSync(fixtureDir, { recursive: true, force: true })
  })

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('CDK_DEFAULT_ACCOUNT overrides env.account', () => {
    process.env.CDK_DEFAULT_ACCOUNT = '999888777666'

    const config = loadConfig({ baseDir: fixtureDir })
    expect(config.env.account).toBe('999888777666')
  })

  it('CDK_DEFAULT_REGION overrides env.region', () => {
    process.env.CDK_DEFAULT_REGION = 'eu-west-1'

    const config = loadConfig({ baseDir: fixtureDir })
    expect(config.env.region).toBe('eu-west-1')
  })

  it('assets fields are loaded from YAML (no defaults applied)', () => {
    const config = loadConfig({ baseDir: fixtureDir })
    expect(config.assets.websiteBundlePath).toBe('../apps_web/dist')
    expect(config.assets.distanceCacheDockerPath).toBe('../apps_opt_engine/build/distancecache-util')
    expect(config.assets.optEngineDockerPath).toBe('../apps_opt_engine/build/nextday-delivery')
  })

  it('throws ZodError when assets block is missing', () => {
    const missingAssetsYaml = yamlStringify({
      env: { account: '111222333444', region: 'us-west-2' },
      namespace: 'fixture',
      administratorEmail: 'fixture@test.com',
      fargateOptions: {
        distCacheCpu: 4096,
        distCacheMemory: 8192,
        distCacheArchitecture: 'arm64',
        optEngineCpu: 4096,
        optEngineMemory: 8192,
        optEngineArchitecture: 'arm64',
      },
      parameterStoreKeys: { testKey: '/Test/Key' },
      // assets intentionally omitted
    })
    const raw = yamlParse(missingAssetsYaml)
    expect(() => RootConfigSchema.parse(raw)).toThrow(ZodError)
  })

  it('throws ZodError when parsed YAML produces invalid config', () => {
    const invalidYaml = [
      "env:",
      "  account: bad-account",
      "  region: us-east-1",
      "namespace: test",
      "fargateOptions:",
      "  distCacheCpu: 4096",
      "  distCacheMemory: 8192",
      "  distCacheArchitecture: arm64",
      "  optEngineCpu: 4096",
      "  optEngineMemory: 8192",
      "  optEngineArchitecture: arm64",
      "parameterStoreKeys:",
      "  key1: /Test/Key",
    ].join('\n')

    const raw = yamlParse(invalidYaml)
    expect(() => RootConfigSchema.parse(raw)).toThrow(ZodError)
  })
})
