/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { Construct } from 'constructs'
import { CfnResource, CfnStack, Resource, Stack, NestedStack } from 'aws-cdk-lib'
import { getRootStack } from './stack'
import shorthash from 'shorthash2'

export function uniqueIdHash(construct: Construct): string {
  return shorthash(construct.node.addr)
}

export function overrideLogicalId(resource: Resource | CfnResource | CfnStack | NestedStack, logicalId: string): void {
  if (resource instanceof Resource) {
    ;(resource.node.defaultChild as CfnResource).overrideLogicalId(logicalId)
  } else if (resource instanceof CfnStack) {
    resource.overrideLogicalId(logicalId)
  } else if (resource instanceof NestedStack) {
    overrideLogicalId(resource.nestedStackResource as CfnResource, logicalId)
  } else {
    resource.overrideLogicalId(logicalId)
  }
}

export const NAMESPACE_SYMBOL = Symbol('namespace')

export function setNamespace(scope: Construct, namespace: string): void {
  const stack = Stack.of(scope)
  stack.node.setContext(NAMESPACE_SYMBOL.toString(), namespace)
}

export function getNamespace(scope: Construct): string {
  const stack = Stack.of(scope)
  const namespace = stack.node.tryGetContext(NAMESPACE_SYMBOL.toString())

  if (namespace) {
    return namespace
  }

  if (stack.nested) {
    return getNamespace(stack.nestedStackParent as Stack)
  }

  throw new Error('No namespace set for stack tree. Call `setNamespace(stack, "somenamespace")` before calling')
}

interface NamespacedOptions {
  /**
   * Indicates if name is forced to lower case.
   * @default false
   */
  lowerCase?: boolean
  /**
   * Delimiter used to separate namespace and resource name.
   * @default "-"
   */
  delimiter?: string
  /**
   * Indicates the uniqueness required for the name.
   * If "region" will append stack region to name.
   * If "global" will append stack account to name.
   * @default "stack"
   */
  scope?: 'stack' | 'region' | 'global'
}

export function namespaced(scope: Construct, name: string | string[], options?: NamespacedOptions): string {
  if (!Array.isArray(name)) {
    name = [name]
  }

  const stack = getRootStack(scope) as Stack
  switch (options?.scope) {
    case 'region': {
      name = name.concat([stack.region])
      break
    }
    case 'global': {
      name = name.concat([stack.account, stack.region])
      break
    }
  }

  const delimiter = options?.delimiter || '-'
  name = name.join(delimiter)

  let namespace = getNamespace(scope)

  if (options?.lowerCase === true) {
    namespace = namespace.toLowerCase()
  }

  name = `${namespace}${delimiter}${name}`

  return name
}

export function regionalNamespaced(scope: Construct, name: string | string[], options?: NamespacedOptions): string {
  return namespaced(scope, name, { scope: 'region', ...(options || {}) })
}

export function globalNamespaced(scope: Construct, name: string | string[], options?: NamespacedOptions): string {
  return namespaced(scope, name, { scope: 'global', ...(options || {}) })
}

export function namespacedBucket(scope: Construct, name: string | string[]): string {
  return globalNamespaced(scope, name, { lowerCase: true })
}
