import * as fs from 'node:fs'
import * as path from 'node:path'
import { parse as parseYaml } from 'yaml'
import * as dotenv from 'dotenv'
import { RootConfigSchema, RootConfig } from './schema'

export interface LoadConfigOptions {
  /**
   * Base directory used to resolve `.env` and `config/default.yml`.
   * Defaults to the current working directory at call time (`process.cwd()`).
   */
  baseDir?: string
}

export function loadConfig(options: LoadConfigOptions = {}): RootConfig {
  const baseDir = options.baseDir ?? process.cwd()

  dotenv.config({ path: path.join(baseDir, '.env'), override: false })

  const rawYaml = fs.readFileSync(path.join(baseDir, 'config', 'default.yml'), 'utf8')
  const raw = parseYaml(rawYaml) ?? {}

  if (process.env.CDK_DEFAULT_ACCOUNT) raw.env = { ...raw.env, account: process.env.CDK_DEFAULT_ACCOUNT }
  if (process.env.CDK_DEFAULT_REGION) raw.env = { ...raw.env, region: process.env.CDK_DEFAULT_REGION }
  if (process.env.ADMINISTRATOR_EMAIL) raw.administratorEmail = process.env.ADMINISTRATOR_EMAIL

  return RootConfigSchema.parse(raw)
}
