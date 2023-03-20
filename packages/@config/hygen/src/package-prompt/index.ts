/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable no-useless-escape */
/* eslint-disable no-template-curly-in-string */
import { valid as validateSemver, SemVer } from 'semver'
import { Prompt } from 'enquirer'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import Snippet from 'enquirer/lib/prompts/snippet'

interface Options {
  readonly scope: string
  readonly license: 'ASL' | 'Apache-2.0' | 'UNLICENSED'
  readonly message?: string
  readonly noAuthor?: boolean
  readonly defaults?: {
    readonly version?: string
    readonly emailDomain?: string
    readonly homepage?: string
    readonly repository?: string
  }
  readonly prefix: boolean
}

interface PackagePrompt {
  readonly params: () => Promise<any>
}

export const createPackagePrompt = (options: Options): PackagePrompt => {
  const createPrompt = async (): Promise<Prompt> => {
    const defaults = {
      ...(options.defaults || {}),
      version: options.defaults?.version || '0.0.0-alpha.0',
      license: options.license,
      author_name: process.env.USER,
      author_email: `${process.env.USER}@${options.defaults?.emailDomain || 'amazon.com'}`,
    }

    return new Snippet({
      name: 'package',
      message: options.message || 'Fill out the fields in package.json',
      required: true,
      fields: [
        {
          name: 'version',
          validate(
            value: string | SemVer | null | undefined,
            state: any,
            item: {
              name: string
            },
            // index: any,
          ): any {
            if (item && item.name === 'version' && !validateSemver(value)) {
              return 'version should be a valid semver value'
            }

            return true
          },
        },
      ],
      template: `{
  "name": "${options.scope}/${options.prefix !== false ? '${prefix}-${name}' : '${name}'}",
  "description": "\${description}",
  "version": "\${version:${defaults.version}}",
  "license": "\${license:${defaults.license}}",
  ${
    options.noAuthor
      ? ''
      : `"author": "\${author_name:${defaults.author_name}} <\${author_email:${defaults.author_email}}>",`
  }
  "homepage": "\${homepage:${escape(defaults.homepage || '')}}",
  "repository": {
    "type": "git",
    "url": "\${repository:${escape(defaults.repository || '')}}"
  },
  ...
}
  `,
    })
  }

  return {
    params: async () => {
      const prompt = await createPrompt()
      const { values } = await prompt.run()
      const { scope, noAuthor } = options
      const { prefix, name, author_name, author_email, homepage, repository } = values

      if (homepage) {
        values.homepage = unescape(homepage)
      }

      if (repository) {
        values.repository = unescape(repository)
      }

      const packageName = options.prefix ? `${options.scope}/${prefix}-${name}` : `${options.scope}/${name}`

      const result = {
        ...values,
        packageScope: scope,
        noAuthor,
        packageName,
        packageDir: `packages/${packageName}`,
        author: `${author_name} <${author_email}>`,
      }

      return result
    },
  }
}
