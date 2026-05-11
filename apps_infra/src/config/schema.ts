import { z } from 'zod'

export const EnvSchema = z.object({
  account: z.string().regex(/^\d{12}$/),
  region: z.string().min(1),
})

export const FargateOptionsSchema = z.object({
  distCacheCpu: z.number().default(4096),
  distCacheMemory: z.number().default(8192),
  distCacheArchitecture: z.enum(['arm64', 'x86_64']).default('arm64'),
  optEngineCpu: z.number().default(4096),
  optEngineMemory: z.number().default(8192),
  optEngineArchitecture: z.enum(['arm64', 'x86_64']).default('arm64'),
})

export const ParameterStoreKeysSchema = z.record(z.string(), z.string().min(1))

export const RootConfigSchema = z.object({
  env: EnvSchema,
  namespace: z.string().min(1),
  administratorEmail: z.string().email(),
  administratorName: z.string().default('Administrator'),
  fargateOptions: FargateOptionsSchema,
  parameterStoreKeys: ParameterStoreKeysSchema,
  assets: z.object({
    websiteBundlePath: z.string().min(1),
    distanceCacheDockerPath: z.string().min(1),
    optEngineDockerPath: z.string().min(1),
  }),
})

export type RootConfig = z.infer<typeof RootConfigSchema>
